import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { PasswordStrengthMeter } from '@/components/common/PasswordStrengthMeter';
import { useApp } from '@/context/AppContext';
import { isValidEmail, passwordStrength } from '@/lib/validation';
import { usePageTitle } from '@/hooks/usePageTitle';

export function ForgotPasswordPage() {
  usePageTitle('Reset password');
  const navigate = useNavigate();

  // History-aware back: behaves like the browser back button, with a
  // sensible fallback when the page was opened directly (no history).
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/login');
  };
  const { requestPasswordReset, resetPassword, authMode } = useApp();
  const cloud = authMode === 'cloud';
  const [step, setStep] = useState<'email' | 'sent' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isValidEmail(email)) {
      setError('Enter a valid email address');
      return;
    }
    setBusy(true);
    const sent = await requestPasswordReset(email);
    setBusy(false);
    if (cloud) {
      // Appwrite emails a secure link — no code step on this page
      toast.success('If that email has an account, a reset link is on its way.');
      setStep('sent');
      return;
    }
    // Same message whether or not the account exists
    if (sent) toast.info(`Demo reset code: ${sent}`, { duration: 20000 });
    toast.success('If that email has an account, a reset code is on its way.');
    setStep('reset');
  };

  const submitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length < 6) return setError('Enter the 6-digit code');
    if (!passwordStrength(password).valid) return setError('Use 8+ characters with at least one letter and one number');
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    const res = resetPassword(email, code, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast.success('Password updated. You can sign in now.');
    navigate('/login', { replace: true });
  };

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 lg:py-16">
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8">
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
              {step === 'email' ? 'Forgot Password?' : 'Reset Password'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {step === 'email'
                ? 'Enter your email and we will send you a reset code'
                : step === 'sent'
                  ? `We sent a reset link to ${email}`
                  : `Enter the code sent to ${email} and choose a new password`}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={sendCode} className="space-y-6" noValidate>
              <div>
                <label htmlFor="email" className={labelClass}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                {busy ? 'Sending...' : 'Send Reset Code'}
              </Button>
            </form>
          ) : step === 'sent' ? (
            <div className="space-y-6">
              <div className="rounded-xl bg-violet-50 dark:bg-violet-700/50 p-4 text-sm text-violet-800 dark:text-violet-100">
                Open the email and tap <span className="font-semibold">Reset Password</span> — it brings you
                straight back here to set a new one. The link expires shortly, so use it while it is fresh.
              </div>
              <Button
                type="button"
                onClick={goBack}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={submitReset} className="space-y-6" noValidate>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

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
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setError('');
                  setCode('');
                }}
                className="block mx-auto text-sm text-violet-600 dark:text-amber-400 hover:underline"
              >
                Use a different email
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t dark:border-violet-700">
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              className="w-full text-gray-600 hover:text-gray-900 hover:bg-transparent dark:text-gray-300 dark:hover:text-white"
            >
              <ArrowLeft className="size-6 mr-1" strokeWidth={2} />
              Back to sign in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
