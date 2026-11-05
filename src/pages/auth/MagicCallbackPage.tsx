import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MailCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Appwrite magic URL landing. The emailed link points here with ?userId=&secret=
 * (and expire=); completing the session both signs the user in and verifies
 * their email address in one step. A hard reload keeps it simple: the context
 * boot probe picks the session up like any returning visit.
 */
export function MagicCallbackPage() {
  usePageTitle('Signing you in');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { completeMagicSignIn } = useApp();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-mount guard
    ran.current = true;
    void (async () => {
      const result = await completeMagicSignIn(
        params.get('userId') || '',
        params.get('secret') || ''
      );
      if (result.ok) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error);
        window.setTimeout(() => navigate('/login?magic=failed', { replace: true }), 3000);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 lg:py-16">
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8 text-center">
          {error ? (
            <>
              <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
                Sign-in didn't complete
              </h1>
              <p className="text-gray-600 dark:text-gray-300">{error}</p>
              <Button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="mt-6 w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                Back to sign in
              </Button>
            </>
          ) : (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-violet-600 dark:text-amber-400 mx-auto" />
              <h1 className="mt-5 font-display font-bold text-2xl text-gray-900 dark:text-white">
                Completing sign-in…
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Verifying your email link. This only takes a second.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
                <MailCheck className="w-4 h-4" />
                Magic links expire 1 hour after they are sent
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
