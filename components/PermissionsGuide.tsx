
import React from 'react';
import { ShieldAlert, Copy, ExternalLink, Check } from 'lucide-react';

export const PermissionsGuide: React.FC = () => {
  const [copied, setCopied] = React.useState(false);

  const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null;
    }
    match /risks/{riskId} {
      allow read, write: if request.auth != null;
    }
  }
}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(rulesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/30 rounded-xl shadow-lg overflow-hidden max-w-2xl w-full mx-auto my-8 transition-colors">
      <div className="bg-red-600 dark:bg-red-700/80 p-4 flex items-center gap-3 text-white transition-colors">
        <ShieldAlert className="w-6 h-6" />
        <div>
          <h2 className="font-bold text-lg">Firestore Permissions Required</h2>
          <p className="text-xs opacity-90">Your database security rules are blocking access.</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-sm text-gray-700 dark:text-slate-300">
          To fix the <strong>"Missing or insufficient permissions"</strong> errors, you must update your Firestore Security Rules in the Firebase Console:
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs">1</span>
            Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">Firebase Console <ExternalLink className="w-3 h-3" /></a>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs">2</span>
            Select <strong>Firestore Database</strong> &gt; <strong>Rules</strong> tab
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-slate-100">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs">3</span>
            Paste the code below and click <strong>Publish</strong>
          </div>
        </div>

        <div className="relative group">
          <pre className="bg-gray-900 dark:bg-black text-emerald-400 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-gray-800 dark:border-slate-800 transition-colors">
            {rulesText}
          </pre>
          <button
            onClick={copyToClipboard}
            className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-md text-white transition-all flex items-center gap-2 text-xs"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy Rules'}
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 italic transition-colors">
          Note: These rules allow any authenticated user to read/write all data. For production environments, you should refine these to specific UID matching.
        </div>
      </div>
    </div>
  );
};
