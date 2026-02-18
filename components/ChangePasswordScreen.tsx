
import React, { useState } from 'react';
import { Lock, ShieldAlert, Loader2, Save, X } from 'lucide-react';
import { updateUserPasswordAndProfile } from '../services/firebaseService';

interface ChangePasswordScreenProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({ onSuccess, onCancel }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await updateUserPasswordAndProfile(newPassword);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError("Failed to update password. Please try again. " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative border border-white/10 dark:border-slate-800 transition-all">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors z-10"
          title="Close and go to dashboard"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="bg-[#f39c12] dark:bg-[#d35400]/80 p-8 text-center transition-colors">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Security Update Required</h1>
          <p className="text-white/90 text-sm mt-2 font-medium">You must change your default password to proceed.</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-1 transition-colors">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#f39c12] outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100 sm:text-sm"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400 dark:text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#f39c12] outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100 sm:text-sm"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-[#d35400] hover:bg-[#e67e22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f39c12] disabled:opacity-70 disabled:cursor-not-allowed transition-all active:scale-[0.98] uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Set New Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
