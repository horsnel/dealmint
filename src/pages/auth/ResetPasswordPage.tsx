import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrengthMeter } from '@/components/common/PasswordStrengthMeter';
import { account, authErrorMessage } from '@/lib/appwrite';
import { passwordStrength } from '@/lib/validation';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Landing target of the Appwrite password-recovery email (cloud mode).
 * The link carries ?userId=…&secret=… — we complete the recovery by setting
 * the new password. Local-mode resets never route here.
 */
export function ResetPasswordPage() {
  usePageTitle('Set a new password');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const userId = params.get('userId') || '';
  const secret = params.get('secret') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const missingLink = !userId || !secret;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!passwordStrength(password).valid) return setError('Use 8+ characters with at least one letter and one number');
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    try {
      await account!.updateRecovery(userId, secret, password);
      setBusy(false);
      setDone(true);
      toast.success('Password updated. You can sign in now.');
      navigate('/login', { replace: true });
    } catch (err) {
      setBusy(false);
      setError(authErrorMessage(err));
    }
  };

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 lg:py-16">
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
              {done ? 'All set' : 'Set a New Password'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {missingLink
                ? 'This reset link looks incomplete. Request a fresh one from the sign-in page.'
                : 'Choose a new password for your account'}
            </p>
          </div>

          {missingLink || done ? (
            <Button
              type="button"
              onClick={() => navigate('/login', { replace: true })}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              Back to sign in
            </Button>
          ) : (
            <form onSubmit={submit} className="space-y-6" noValidate>
              <div>
                <label htmlFor="new-password" className={labelClass}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 dark:bg-violet-700 dark:border-violet-600"
                  />
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              <div>
                <label htmlFor="confirm-password" className={labelClass}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 dark:bg-violet-700 dark:border-violet-600"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {busy ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
