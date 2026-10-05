import { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile } from '../types';
import {
    onAuthStateChange,
    fetchUserProfile,
    checkUserNeedsPasswordChange,
    isPermissionError,
    logoutUser,
    loginWithGCMEUser,
} from '../services/firebaseService';
import {
    extractGCMECallback,
    storeGCMESession,
    getStoredGCMEUser,
    getStoredGCMEToken,
    decodeGCMEToken,
    clearGCMESession,
    cleanCallbackUrl,
} from '../services/gcmeAuthService';

export function useAuth() {
    const isDemo =
        typeof window !== 'undefined' &&
        (new URLSearchParams(window.location.search).get('demo') === 'true' ||
            localStorage.getItem('demo_mode') === 'true');

    const [user, setUser] = useState<any>(() =>
        isDemo
            ? { uid: 'demo-admin-01', email: 'anupong.th@gcmeapp.com', displayName: 'Anupong (Admin)' }
            : null
    );
    const [userProfile, setUserProfile] = useState<UserProfile | null>(() =>
        isDemo
            ? {
                  id: 'demo-admin-01',
                  email: 'anupong.th@gcmeapp.com',
                  role: 'Admin',
                  assignedProjects: ['P26-001', 'P26-002', 'P25-089'],
                  isDefaultPassword: false,
                  createdAt: '2026-01-01T00:00:00.000Z',
              }
            : null
    );
    const [authLoading, setAuthLoading] = useState(!isDemo);
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [checkingProfile, setCheckingProfile] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    // Guard: prevents onAuthStateChanged from re-processing while GCME flow is active
    const gcmeHandledRef = useRef(false);

    // --------------------------------------------------------------------------
    // GCME SSO Callback Handler
    // Runs on mount: checks if URL returned from https://login.gcmeapps.com/
    // with token in path (/:username/:token) or query (?token=...&username=...)
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (isDemo) return;

        const handleGCMECallback = async () => {
            const callbackData = extractGCMECallback();
            if (!callbackData) return;

            // Mark GCME flow as active so onAuthStateChanged won't duplicate work
            gcmeHandledRef.current = true;

            setAuthLoading(true);
            try {
                const { token, userInfo } = callbackData;

                // Clean the browser address bar FIRST to prevent re-extraction
                cleanCallbackUrl();

                // Save session in sessionStorage
                storeGCMESession(token, userInfo);

                // Upsert Firestore profile & get virtual user
                const virtualUser = await loginWithGCMEUser(userInfo);
                setUser(virtualUser);

                // Sync effective email back to session if resolved differently
                if (virtualUser?.email && virtualUser.email !== userInfo.email) {
                    userInfo.email = virtualUser.email;
                    if (virtualUser.displayName) userInfo.name = virtualUser.displayName;
                    storeGCMESession(token, userInfo);
                }

                setCheckingProfile(true);
                try {
                    const profile = await fetchUserProfile(virtualUser.uid);
                    setUserProfile(profile);
                    setMustChangePassword(false);
                } catch (err) {
                    if (isPermissionError(err)) setPermissionDenied(true);
                } finally {
                    setCheckingProfile(false);
                }
            } catch (err) {
                console.error('[useAuth] GCME callback error:', err);
                clearGCMESession();
                cleanCallbackUrl();
            } finally {
                setAuthLoading(false);
            }
        };

        // Restore GCME session after page refresh
        const restoreGCMESession = async (): Promise<boolean> => {
            const storedToken = getStoredGCMEToken();
            let storedGCMEUser = getStoredGCMEUser();
            if (!storedGCMEUser && !storedToken) return false;

            // Mark GCME flow as active
            gcmeHandledRef.current = true;

            try {
                // If storedToken is available, re-decode with latest decoding logic
                if (storedToken) {
                    try {
                        const freshInfo = decodeGCMEToken(storedToken, storedGCMEUser?.username);
                        storedGCMEUser = freshInfo;
                        storeGCMESession(storedToken, freshInfo);
                    } catch (e) {
                        // ignore decode errors on restore
                    }
                }

                if (!storedGCMEUser) return false;

                const virtualUser = await loginWithGCMEUser(storedGCMEUser);
                setUser(virtualUser);
                setPermissionDenied(false);

                // Sync resolved effective email (e.g. anupong.th@pttgcgroup.com) back to session
                if (virtualUser?.email && virtualUser.email !== storedGCMEUser.email) {
                    storedGCMEUser.email = virtualUser.email;
                    if (virtualUser.displayName) storedGCMEUser.name = virtualUser.displayName;
                    if (storedToken) storeGCMESession(storedToken, storedGCMEUser);
                }

                setCheckingProfile(true);
                try {
                    const profile = await fetchUserProfile(virtualUser.uid);
                    setUserProfile(profile);
                    setMustChangePassword(false);
                } catch (err) {
                    if (isPermissionError(err)) setPermissionDenied(true);
                } finally {
                    setCheckingProfile(false);
                }
                return true;
            } catch (err) {
                console.warn('[useAuth] Error restoring GCME session:', err);
                return false;
            }
        };

        const callbackData = extractGCMECallback();
        if (callbackData) {
            handleGCMECallback();
        } else {
            restoreGCMESession().then((restored) => {
                if (restored) {
                    setAuthLoading(false);
                }
            });
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // --------------------------------------------------------------------------
    // Firebase Native Auth State Listener (email/password login)
    // --------------------------------------------------------------------------
    useEffect(() => {
        if (isDemo) return;

        const unsubscribeAuth = onAuthStateChange(async (currentUser) => {
            // If GCME flow already handled auth, skip entirely to prevent duplicate writes
            if (gcmeHandledRef.current) {
                setAuthLoading(false);
                return;
            }

            // If GCME session is active, don't let Firebase auth clear user
            const storedGCMEUser = getStoredGCMEUser();
            if (storedGCMEUser) {
                setAuthLoading(false);
                return;
            }

            setUser(currentUser);

            if (currentUser) {
                setCheckingProfile(true);
                try {
                    const profile = await fetchUserProfile(currentUser.uid);
                    setUserProfile(profile);
                    const needsChange = await checkUserNeedsPasswordChange(currentUser.uid);
                    setMustChangePassword(needsChange);
                } catch (err) {
                    if (isPermissionError(err)) setPermissionDenied(true);
                } finally {
                    setCheckingProfile(false);
                }
            } else {
                setUserProfile(null);
                setMustChangePassword(false);
                setPermissionDenied(false);
            }

            setAuthLoading(false);
        });
        return () => unsubscribeAuth();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleLogout = useCallback(async () => {
        try {
            gcmeHandledRef.current = false; // Reset so next login works
            clearGCMESession();
            setUser(null);
            setUserProfile(null);
            await logoutUser();
        } catch (error) {
            console.error('Logout failed', error);
        }
    }, []);

    const isAdmin = userProfile?.role === 'Admin';

    const canModifyProject = useCallback(
        (projectNo: string) => {
            if (isAdmin) return true;
            return userProfile?.assignedProjects?.includes(projectNo);
        },
        [isAdmin, userProfile]
    );

    return {
        user,
        userProfile,
        authLoading,
        mustChangePassword,
        checkingProfile,
        permissionDenied,
        setMustChangePassword,
        setPermissionDenied,
        setUserProfile,
        handleLogout,
        isAdmin,
        canModifyProject,
    };
}
