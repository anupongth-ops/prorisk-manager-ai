import React, { useState, useEffect } from 'react';
import { AlertOctagon, Lock, Mail, Loader2, Info, UserPlus, LogIn, CheckCircle, Settings, Copy, ExternalLink, ShieldAlert, KeyRound, ArrowLeft, X } from 'lucide-react';
import { loginWithEmail, registerWithDefaultPassword, isConfigured, resetUserPassword } from '../services/firebaseService';

export const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authDomainError, setAuthDomainError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [configMissing, setConfigMissing] = useState(false);

  useEffect(() => {
    if (!isConfigured()) {
      setConfigMissing(true);
    }
  }, []);

  const copyDomain = () => {
    if (authDomainError) {
      navigator.clipboard.writeText(authDomainError);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setResetSuccess(null);

    try {
      await resetUserPassword(email);
      setResetSuccess("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      console.error("Reset Error:", err);
      const code = err.code;
      if (code === 'auth/user-not-found') {
        setError("No account found with this email.");
      } else if (code === 'auth/invalid-email') {
        setError("Invalid email format.");
      } else {
        setError("Failed to send reset email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRegisterSuccess(null);
    setAuthDomainError(null);

    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else if (mode === 'register') {
        await registerWithDefaultPassword(email.trim());
        setRegisterSuccess("Account created successfully!");
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      console.error("Auth Error Object:", err);

      const code = err.code || '';
      const msg = err.message || '';

      // Unauthorized Domain Check
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setAuthDomainError(window.location.hostname);
        return;
      }

      // Handle Invalid Credentials (Unified error code in modern Firebase)
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password' ||
        code === 'auth/invalid-login-credentials' ||
        msg.includes('auth/invalid-credential')
      ) {
        setError("Invalid email or password. Please check your credentials.");
      }
      // Handle Email Specific Errors
      else if (code === 'auth/invalid-email') {
        setError("The email address is badly formatted.");
      }
      else if (code === 'auth/email-already-in-use') {
        setError("This email address is already registered. Please sign in instead.");
      }
      // Handle Rate Limiting
      else if (code === 'auth/too-many-requests') {
        setError("Access has been temporarily disabled due to many failed login attempts. Please reset your password or try again later.");
      }
      // Handle Configuration Issues
      else if (msg.includes("auth-not-initialized") || code === 'auth/api-key-not-valid') {
        setConfigMissing(true);
      }
      // Fallback
      else {
        setError(msg || "An unexpected authentication error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (configMissing) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-8 text-center border border-white/10 dark:border-slate-800 transition-all">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Configuration Required</h1>
          <p className="text-gray-600 dark:text-slate-400 mb-6 text-sm leading-relaxed">
            The Firebase connection could not be established. This may be due to an invalid API Key or project restrictions.
          </p>
          <div className="bg-gray-50 dark:bg-slate-800/50 text-left p-4 rounded-lg text-xs font-mono border border-gray-200 dark:border-slate-700 overflow-x-auto mb-6 transition-colors">
            <p className="font-bold text-gray-700 dark:text-slate-300 mb-2">// services/firebaseService.ts</p>
            <p className="text-gray-500 dark:text-slate-500">const firebaseConfig = &#123;</p>
            <p className="text-red-500 dark:text-red-400 pl-4">apiKey: "VALID_API_KEY",</p>
            <p className="text-red-500 dark:text-red-400 pl-4">projectId: "risk-e-po-pm",</p>
            <p className="text-gray-500 dark:text-slate-500 pl-4">...</p>
            <p className="text-gray-500 dark:text-slate-500">&#125;;</p>
          </div>
          <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 dark:bg-blue-700 text-white px-6 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition w-full font-bold">
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-white/10 dark:border-slate-800 transition-all">

        {/* Header */}
        <div className="bg-blue-600 dark:bg-blue-800 p-8 text-center relative transition-colors">
          {(mode === 'forgot-password' || mode === 'register') && (
            <button
              onClick={() => { setMode('login'); setError(null); setResetSuccess(null); setRegisterSuccess(null); }}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
              title="Back to Login"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <AlertOctagon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide uppercase">Risk Manager E-PO-PM</h1>
          <p className="text-blue-100 dark:text-blue-200 text-sm mt-2 font-medium">by GCME (E-PO-PM )</p>
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot-password' && (
          <div className="flex border-b border-gray-200 dark:border-slate-800">
            <button
              onClick={() => { setMode('login'); setError(null); setRegisterSuccess(null); setAuthDomainError(null); }}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${mode === 'login' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setMode('register'); setError(null); setRegisterSuccess(null); setAuthDomainError(null); }}
              className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${mode === 'register' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300'}`}
            >
              REGISTER
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-8">

          {mode === 'forgot-password' ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">Reset Password</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400">Enter your email to receive a reset link.</p>
              </div>

              {resetSuccess ? (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 px-4 py-4 rounded-xl text-sm flex flex-col items-center gap-3 text-center mb-6 transition-colors">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                  <span className="font-medium">{resetSuccess}</span>
                  <button
                    onClick={() => { setMode('login'); setResetSuccess(null); setError(null); }}
                    className="mt-2 text-xs font-bold bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition"
                  >
                    Return to Sign In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2 transition-colors">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                      </div>
                      <input
                        type="email"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100 sm:text-sm hover:border-gray-300 dark:hover:border-slate-600"
                        placeholder="name@pttgcgroup.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all active:scale-[0.98] uppercase tracking-widest"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </form>
              )}

              {!resetSuccess && (
                <button
                  onClick={() => { setMode('login'); setError(null); }}
                  className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Sign In
                </button>
              )}
            </div>
          ) : (
            <>
              {registerSuccess && (
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm mb-6 flex items-center gap-2 transition-colors">
                  <CheckCircle className="w-4 h-4" />
                  <span>{registerSuccess}</span>
                </div>
              )}

              {authDomainError ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-xl p-5 shadow-inner transition-colors">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold mb-3">
                      <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                      Domain Not Authorized
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-4 leading-relaxed">
                      Firebase blocks sign-ins from unauthorized domains. You must whitelist this hostname in your Firebase Console.
                    </p>

                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-amber-200 dark:border-amber-900/30 mb-6 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold">Current Hostname</p>
                        <code className="text-sm font-mono text-gray-800 dark:text-slate-200 truncate font-bold block">{authDomainError}</code>
                      </div>
                      <button
                        onClick={copyDomain}
                        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-bold transition-all shadow-sm ${copySuccess ? 'bg-green-600 text-white' : 'bg-gray-800 text-white hover:bg-black'}`}
                      >
                        {copySuccess ? <><CheckCircle className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
                      </button>
                    </div>

                    <div className="space-y-4">
                      <p className="text-xs font-bold text-amber-900 uppercase tracking-widest">Setup Steps:</p>
                      <ol className="list-decimal pl-4 text-xs text-amber-800 space-y-1.5">
                        <li>Open <strong>Firebase Console</strong>.</li>
                        <li>Go to <strong>Authentication</strong> &gt; <strong>Settings</strong>.</li>
                        <li>Add <code>{authDomainError}</code> to <strong>Authorized domains</strong>.</li>
                      </ol>

                      <a
                        href={`https://console.firebase.google.com/project/risk-e-po-pm/authentication/settings`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold shadow-lg transition-transform active:scale-95 mt-2"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Console
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => setAuthDomainError(null)}
                    className="w-full py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 uppercase tracking-widest"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm flex items-start gap-2 animate-in slide-in-from-left-2 transition-colors">
                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                      </div>
                      <input
                        type="email"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100 sm:text-sm hover:border-gray-300 dark:hover:border-slate-600"
                        placeholder="name@pttgcgroup.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">Password</label>
                        <button
                          type="button"
                          onClick={() => { setMode('forgot-password'); setError(null); }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                        </div>
                        <input
                          type="password"
                          required
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100 sm:text-sm hover:border-gray-300 dark:hover:border-slate-600"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 transition-all active:scale-[0.98] uppercase tracking-widest"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      mode === 'login' ? 'Sign In' : 'Create Account'
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};