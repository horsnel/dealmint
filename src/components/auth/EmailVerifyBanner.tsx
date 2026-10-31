import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MailWarning, X } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';

const DISMISS_KEY = 'dealmint_email_verify_dismissed';

/**
 * Slim nudge for signed-in cloud users whose Appwrite account email is still
 * unverified. Verification itself is opt-in in Appwrite (unlike Supabase's
 * mandatory confirmation mail), so the app reminds instead of blocking.
 */
export function EmailVerifyBanner() {
  const { user, authMode, emailVerified, sendEmailVerification } = useApp();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!user || authMode !== 'cloud' || emailVerified !== false || dismissed) return null;

  const resend = async () => {
    setSending(true);
    const r = await sendEmailVerification();
    setSending(false);
    if (r.ok) toast.success(`Verification email sent to ${user.email}`);
    else toast.error(r.error);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // in-memory only
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
        <MailWarning className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <p className="flex-1 min-w-0 text-amber-900 dark:text-amber-200">
          Please verify your email address (<span className="font-medium break-all">{user.email}</span>) to secure your
          account.{' '}
          <Link to="/verify-email" className="underline font-medium whitespace-nowrap">
            What's this?
          </Link>
        </p>
        <button
          type="button"
          onClick={resend}
          disabled={sending}
          className="shrink-0 rounded-md bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-xs font-semibold px-3 py-1.5"
        >
          {sending ? 'Sending…' : 'Resend email'}
        </button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={dismiss}
          className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
