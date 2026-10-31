import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Appwrite OAuth2 success landing. The provider redirect already set the
 * session cookie on the API domain — here we adopt the session, publish a
 * profile document for brand-new social accounts, then enter the app.
 */
export function OAuthCallbackPage() {
  usePageTitle('Signing you in');
  const navigate = useNavigate();
  const { completeOAuthSignIn } = useApp();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // StrictMode double-mount guard
    ran.current = true;
    void (async () => {
      const result = await completeOAuthSignIn();
      if (result.ok) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error);
        window.setTimeout(() => navigate('/login?oauth=failed', { replace: true }), 2500);
      }
    })();
  }, [completeOAuthSignIn, navigate]);

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
                Setting up your account. This only takes a second.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
