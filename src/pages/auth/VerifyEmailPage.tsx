import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgeCheck, Loader2, MailCheck, MailWarning } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { account, authErrorMessage } from '@/lib/appwrite';
import { useApp } from '@/context/AppContext';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Landing target of the Appwrite verification email (cloud mode). The link
 * carries ?userId=…&secret=… — completing it flips the account's
 * emailVerification flag. Without params it doubles as the resend panel for
 * signed-in users whose email is still unverified.
 */
export function VerifyEmailPage() {
  usePageTitle('Verify your email');
  const navigate = useNavigate();
  const { user, emailVerified, sendEmailVerification, markEmailVerified } = useApp();
  const [phase, setPhase] = useState<'verifying' | 'done' | 'error' | 'idle' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const ran = useRef(false);

  // Query params straight from window.location: this page mounts before the
  // router settles on some email-link clients, and search params are all we need.
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId') || '';
  const secret = params.get('secret') || '';

  useEffect(() => {
    if (!userId || !secret || ran.current) return;
    ran.current = true; // StrictMode double-mount guard
    if (!account) {
      setError('Cloud backend unavailable. Please try again later.');
      setPhase('error');
      return;
    }
    setPhase('verifying');
    account
      .updateVerification(userId, secret)
      .then(() => {
        markEmailVerified();
        setPhase('done');
      })
      .catch((e) => {
        setError(authErrorMessage(e));
        setPhase('error');
      });
  }, [userId, secret, markEmailVerified]);

  const resend = async () => {
    setSending(true);
    const r = await sendEmailVerification();
    setSending(false);
    if (r.ok) {
      setPhase('sent');
    } else {
      toast.error(r.error);
    }
  };

  const title =
    phase === 'verifying'
      ? 'Verifying your email…'
      : phase === 'done'
        ? 'Email verified'
        : phase === 'sent'
          ? 'Check your inbox'
          : phase === 'error'
            ? 'Verification failed'
            : user
              ? 'Verify your email address'
              : 'Verify your email';

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 lg:py-16">
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8 text-center">
          {phase === 'verifying' && <Loader2 className="w-12 h-12 animate-spin text-violet-600 dark:text-amber-400 mx-auto" />}
          {phase === 'done' && (
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto">
              <BadgeCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          )}
          {(phase === 'sent' || phase === 'idle' || phase === 'error') && (
            <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-700/60 flex items-center justify-center mx-auto">
              {phase === 'error' ? (
                <MailWarning className="w-8 h-8 text-red-500 dark:text-red-400" />
              ) : (
                <MailCheck className="w-8 h-8 text-violet-600 dark:text-amber-400" />
              )}
            </div>
          )}

          <h1 className="mt-5 font-display font-bold text-2xl text-gray-900 dark:text-white">{title}</h1>

          {phase === 'verifying' && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">One moment while we confirm this link is valid.</p>
          )}

          {phase === 'done' && (
            <>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Your email address is confirmed. Your account is now fully set up.
              </p>
              <div className="mt-6 space-y-3">
                {user ? (
                  <Button
                    type="button"
                    onClick={() => navigate('/dashboard', { replace: true })}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    Go to dashboard
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => navigate('/login', { replace: true })}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    Sign in
                  </Button>
                )}
              </div>
            </>
          )}

          {phase === 'sent' && (
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              We emailed a verification link to{' '}
              <span className="font-medium text-gray-900 dark:text-white">{user?.email || 'your address'}</span>. It
              expires in 7 days — click it to finish verification.
            </p>
          )}

          {phase === 'error' && (
            <>
              <p className="mt-2 text-gray-600 dark:text-gray-300">{error}</p>
              {user ? (
                <Button
                  type="button"
                  onClick={resend}
                  disabled={sending}
                  className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {sending ? 'Sending…' : 'Send a fresh verification email'}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => navigate('/login', { replace: true })}
                  className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Sign in to resend
                </Button>
              )}
            </>
          )}

          {phase === 'idle' && (
            <>
              {user ? (
                emailVerified === true ? (
                  <>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      Good news — your email is already verified.
                    </p>
                    <Button
                      type="button"
                      onClick={() => navigate('/dashboard', { replace: true })}
                      className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      Go to dashboard
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-gray-600 dark:text-gray-300">
                      We need to confirm <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>{' '}
                      belongs to you. Click below and we'll email you a secure verification link.
                    </p>
                    <Button
                      type="button"
                      onClick={resend}
                      disabled={sending}
                      className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white"
                    >
                      {sending ? 'Sending…' : 'Email me a verification link'}
                    </Button>
                  </>
                )
              ) : (
                <>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    Sign in first — then we can email you a verification link for your account.
                  </p>
                  <Button
                    type="button"
                    onClick={() => navigate('/login', { replace: true })}
                    className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    Sign in
                  </Button>
                </>
              )}
            </>
          )}

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Back to{' '}
            <Link to="/" className="text-violet-600 dark:text-amber-400 hover:underline">
              the marketplace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
