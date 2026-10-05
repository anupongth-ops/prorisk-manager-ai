/**
 * gcmeAuthService.ts
 * Integration with GCME SSO Gateway at https://login.gcmeapps.com/
 *
 * Real protocol used by GCME Single Sign-On:
 *  1. App initiates login by redirecting the user to:
 *     https://login.gcmeapps.com/signin/<encodeURIComponent(redirectUrl)>
 *  2. User signs in on GCME Login portal (authenticated via Azure AD).
 *  3. GCME backend generates a JWT token and redirects back to our app via:
 *     - Path parameters:   <redirectUrl>/<username>/<token>
 *     - OR Query params:   <redirectUrl>?username=<username>&token=<token>
 *  4. App extracts username + token, decodes JWT user payload, and establishes session.
 */

export const GCME_SSO_CONFIG = {
  /** Base URL of the GCME login gateway */
  baseUrl: 'https://login.gcmeapps.com',

  /** Default domain fallback if email is not present in token */
  defaultDomain: 'pttgcgroup.com',

  /** Storage keys */
  tokenKey: 'gcme_access_token',
  userKey: 'gcme_user',
} as const;

/**
 * Pre-configured directory mapping numeric Employee IDs to corporate profiles.
 * Prevents creation of numeric fallback accounts (e.g. 26004950@pttgcgroup.com)
 * when GCME SSO Azure AD token only returns Employee ID in claims/name.
 */
export const KNOWN_EMPLOYEE_ACCOUNTS: Record<string, {
  email: string;
  name: string;
  department: string;
  jobTitle: string;
}> = {
  '26004950': {
    email: 'anupong.th@pttgcgroup.com',
    name: 'Anupong Thonghan',
    department: 'E-PO-PM',
    jobTitle: 'Project Manager'
  }
};

export interface GCMEUserInfo {
  sub: string;
  email: string;
  name: string;
  username?: string;
  department?: string;
  jobTitle?: string;
  roles?: string[];
  rawPayload?: Record<string, any>;
}

export interface GCMECallbackResult {
  token: string;
  username?: string;
  userInfo: GCMEUserInfo;
}

/**
 * Initiates login by redirecting the browser to GCME SSO portal.
 *
 * NOTE (Approach 2):
 * By appending `?auth=mspro` to the redirectUrl:
 * 1. Path `/epopm/` keeps trailing slash so Nginx won't 301-redirect.
 * 2. GCME Gateway detects 'mspro' and switches to Query String return mode:
 *    `https://epopm.gcmeapps.com/epopm/?auth=mspro?username=...&token=...`
 * 3. This avoids Nginx HTTP 404 Not Found on servers that lack SPA URL rewrite rules!
 */
export const initiateGCMELogin = (): void => {
  const origin = window.location.origin;
  const basePath = '/';
  const redirectUrl = `${origin}${basePath}?auth=mspro`;

  const targetUrl = `${GCME_SSO_CONFIG.baseUrl}/signin/${encodeURIComponent(redirectUrl)}`;

  console.log('[GCME SSO] Redirecting to GCME Portal (Query String mode):', targetUrl);
  window.location.href = targetUrl;
};

/**
 * Safe base64url decode with UTF-8 support
 */
const base64UrlDecode = (str: string): string => {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (err) {
    return atob(base64);
  }
};

/**
 * Parses and decodes a JWT payload without external libraries
 */
export const decodeGCMEToken = (token: string, fallbackUsername?: string): GCMEUserInfo => {
  let payload: Record<string, any> = {};

  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const decodedStr = base64UrlDecode(parts[1]);
      payload = JSON.parse(decodedStr);
      // Log ALL keys so we can debug what the token provides
      console.log('[GCME SSO] Decoded Token Payload keys:', Object.keys(payload));
      console.log('[GCME SSO] Decoded Token Payload:', JSON.stringify(payload, null, 2));
    }
  } catch (e) {
    console.warn('[GCME SSO] Failed to decode JWT payload, using fallback', e);
  }

  // Helper: check if email string is based on numeric employee ID (e.g. 26004950@...)
  const isEmployeeIdEmail = (str: string) => /^\d+@/.test(str.trim());

  // The pttgc.corp GCME token uses claims/name to carry the employee ID (e.g. "26004950")
  // We must detect this and treat it as the nameIdentifier, NOT as a display name
  const claimsNameValue = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || '';
  const claimsNameIsEmployeeId = /^\d+$/.test(String(claimsNameValue).trim());

  // Extract nameidentifier (employee ID or username) from WS-Federation claim
  const nameIdentifier =
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ||
    payload['http://schemas.microsoft.com/identity/claims/objectidentifier'] ||
    payload.nameidentifier ||
    (claimsNameIsEmployeeId ? claimsNameValue : '') ||  // Use claims/name if it's a numeric employee ID
    payload.onPremisesSamAccountName ||
    payload.samAccountName ||
    fallbackUsername ||
    '';

  // Collect all possible corporate email candidates from JWT claims
  const candidates: string[] = [
    payload.mail,
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
    payload.email,
    payload.smtp,
    payload.userEmail,
    payload.otherMails?.[0],
    payload.emails?.[0],
    payload.preferred_username,
    payload.upn,
    payload.userPrincipalName,
    payload.unique_name,
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn'],
    // Only include claims/name as email candidate if it contains '@' (i.e., it's actually an email)
    (claimsNameIsEmployeeId ? undefined : claimsNameValue) as string | undefined,
  ].filter((c): c is string => typeof c === 'string' && c.includes('@'));

  // Also scan any other top-level string fields in payload that might contain an email address
  for (const val of Object.values(payload)) {
    if (typeof val === 'string' && val.includes('@') && !candidates.includes(val)) {
      candidates.push(val);
    }
  }

  // Priority 1: Named corporate email (e.g. anupong.th@pttgcgroup.com)
  const namedEmail = candidates.find(c => !isEmployeeIdEmail(c));

  // Priority 2: Any employee-id email
  // Priority 3: Build email from nameidentifier (employee ID) + domain
  // Priority 4: Fallback from fallbackUsername
  const employeeIdFromClaim = String(nameIdentifier).trim();
  const knownProfile = employeeIdFromClaim ? KNOWN_EMPLOYEE_ACCOUNTS[employeeIdFromClaim] : undefined;

  const builtEmail = employeeIdFromClaim && /^\d+$/.test(employeeIdFromClaim)
    ? `${employeeIdFromClaim}@${GCME_SSO_CONFIG.defaultDomain}`
    : (fallbackUsername ? `${fallbackUsername.toLowerCase()}@${GCME_SSO_CONFIG.defaultDomain}` : '');

  const emailClaim =
    namedEmail ||
    knownProfile?.email ||
    candidates[0] ||
    builtEmail;

  // Extract name (English name / Display Name)
  // IMPORTANT: If claims/name is numeric (employee ID), do NOT use it as display name
  const nameClaim =
    payload.name ||
    payload.displayName ||
    (payload.given_name ? `${payload.given_name} ${payload.family_name || ''}`.trim() : '') ||
    payload.englishName ||
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] ||
    knownProfile?.name ||
    (!claimsNameIsEmployeeId ? claimsNameValue : '') ||  // Only use claims/name as display name if NOT numeric
    fallbackUsername ||
    'GCME User';  // Will be overridden by Firestore profile displayName

  // Extract department
  const departmentClaim =
    payload.department ||
    payload.dept ||
    payload.division ||
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department'] ||
    payload.companyName ||
    knownProfile?.department ||
    'GCME';

  // Extract job title
  const jobTitleClaim =
    payload.jobTitle ||
    payload.title ||
    payload.position ||
    payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/jobtitle'] ||
    knownProfile?.jobTitle ||
    'Staff';

  // Extract user ID / sub — prefer nameidentifier (employee ID) for stable identity
  const subClaim =
    payload.sub ||
    payload.oid ||
    payload.sid ||
    nameIdentifier ||
    fallbackUsername ||
    emailClaim.replace(/[^a-zA-Z0-9]/g, '_');

  // Resolve username: prefer fallbackUsername (from URL path), then numeric nameIdentifier
  const resolvedUsername =
    fallbackUsername ||
    (employeeIdFromClaim && /^\d+$/.test(employeeIdFromClaim) ? employeeIdFromClaim : undefined) ||
    payload.onPremisesSamAccountName;

  console.log('[GCME SSO] Resolved → employeeId:', employeeIdFromClaim, '| email:', emailClaim, '| name:', nameClaim, '| username:', resolvedUsername);


  return {
    sub: String(subClaim),
    email: String(emailClaim).toLowerCase().trim(),
    name: String(nameClaim).trim(),
    username: resolvedUsername,
    department: String(departmentClaim).trim(),
    jobTitle: String(jobTitleClaim).trim(),
    roles: Array.isArray(payload.role || payload.roles)
      ? payload.role || payload.roles
      : payload.role
      ? [payload.role]
      : [],
    rawPayload: payload,
  };
};



/**
 * Checks if the current browser URL is a GCME SSO callback.
 * Checks both:
 *  1. Query params (Approach 2): ?token=xxx OR ?username=xxx&token=yyy
 *  2. Path segments (Fallback): /:username/:token
 */
export const extractGCMECallback = (): GCMECallbackResult | null => {
  if (typeof window === 'undefined') return null;

  // 1. Check Query Parameters via Regex on href (Handles single or multiple '?' gracefully)
  const href = window.location.href;
  const tokenMatch = href.match(/[?&]token=([^&?#]+)/);
  const userMatch = href.match(/[?&]username=([^&?#]+)/);

  if (tokenMatch && tokenMatch[1] && tokenMatch[1].length > 10) {
    const token = decodeURIComponent(tokenMatch[1]);
    const username = userMatch && userMatch[1] ? decodeURIComponent(userMatch[1]) : undefined;
    const userInfo = decodeGCMEToken(token, username);
    return { token, username, userInfo };
  }

  // Standard URLSearchParams check (Fallback)
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get('token');
  const queryUsername = params.get('username') || undefined;

  if (queryToken && queryToken.trim().length > 10) {
    const userInfo = decodeGCMEToken(queryToken, queryUsername);
    return { token: queryToken, username: queryUsername, userInfo };
  }

  // 2. Check Path Segments (Fallback: /<username>/<token>)
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean); // [username, token]

  const epopmIndex = segments.indexOf('epopm');
  const remaining = epopmIndex !== -1 ? segments.slice(epopmIndex + 1) : segments;

  if (remaining.length >= 2) {
    // [username, token]
    const username = decodeURIComponent(remaining[0]);
    const token = remaining[1];
    if (token && token.length > 10) {
      const userInfo = decodeGCMEToken(token, username);
      return { token, username, userInfo };
    }
  } else if (remaining.length === 1) {
    // [token]
    const token = remaining[0];
    if (token && token.includes('.') && token.length > 20) {
      const userInfo = decodeGCMEToken(token);
      return { token, userInfo };
    }
  }

  return null;
};

/**
 * Persists GCME session to sessionStorage
 */
export const storeGCMESession = (token: string, userInfo: GCMEUserInfo): void => {
  sessionStorage.setItem(GCME_SSO_CONFIG.tokenKey, token);
  sessionStorage.setItem(GCME_SSO_CONFIG.userKey, JSON.stringify(userInfo));
};

/**
 * Retrieves persisted GCME user from sessionStorage
 */
export const getStoredGCMEUser = (): GCMEUserInfo | null => {
  const raw = sessionStorage.getItem(GCME_SSO_CONFIG.userKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GCMEUserInfo;
  } catch {
    return null;
  }
};

/**
 * Retrieves stored GCME token
 */
export const getStoredGCMEToken = (): string | null => {
  return sessionStorage.getItem(GCME_SSO_CONFIG.tokenKey);
};

/**
 * Clears GCME session
 */
export const clearGCMESession = (): void => {
  sessionStorage.removeItem(GCME_SSO_CONFIG.tokenKey);
  sessionStorage.removeItem(GCME_SSO_CONFIG.userKey);
};

/**
 * Cleans the URL bar back to clean root / without page reload
 */
export const cleanCallbackUrl = (): void => {
  const cleanPath = '/';
  window.history.replaceState({}, document.title, cleanPath);
};
