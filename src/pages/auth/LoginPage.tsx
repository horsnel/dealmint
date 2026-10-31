import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, MailCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/data/seed';
import { usePageTitle } from '@/hooks/usePageTitle';

export function LoginPage() {
  usePageTitle('Log in');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useApp();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, from, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password, formData.rememberMe);
      setIsLoading(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch {
      setIsLoading(false);
      setError('Something went wrong. Please try again.');
    }
  };

  const fillDemo = () => {
    setFormData({ ...formData, email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setError('');
  };

  // Magic link (Postall-style passwordless sign-in) — simulated in this demo
  const [magicOpen, setMagicOpen] = useState(false);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicStage, setMagicStage] = useState<'form' | 'sending' | 'sent'>('form');
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setInterval(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [resendIn]);

  const openMagic = () => {
    setMagicStage('form');
    setMagicEmail(formData.email);
    setMagicOpen(true);
  };

  const sendMagic = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(magicEmail.trim())) {
      toast.error('Enter a valid email address');
      return;
    }
    setMagicStage('sending');
    setTimeout(() => {
      setMagicStage('sent');
      setResendIn(60);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 lg:py-16">
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Sign in to your Dealmint account
            </p>
          </div>

          <div className="mb-6 rounded-xl bg-violet-50 dark:bg-violet-700/50 p-3 text-sm text-violet-800 dark:text-violet-100">
            Want a quick look around?{' '}
            <button type="button" onClick={fillDemo} className="font-semibold underline">
              Fill in the demo account
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate={false}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  autoComplete="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="you@example.com"
                  required
                  className="pl-10 dark:bg-violet-700 dark:border-violet-600"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  autoComplete="current-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  required
                  className="pl-10 pr-10 dark:bg-violet-700 dark:border-violet-600"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={formData.rememberMe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, rememberMe: checked as boolean })
                  }
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/forgot-password"
                className="text-sm text-violet-600 dark:text-amber-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-violet-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white dark:bg-violet-800 text-sm text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="dark:border-violet-600 dark:text-white"
              onClick={() => toast.info('Google login coming soon!')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="dark:border-violet-600 dark:text-white"
              onClick={() => toast.info('Apple login coming soon!')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zm-5.85-15.1c.07-2.04 1.76-3.79 3.78-3.94.29 2.32-1.93 4.48-3.78 3.94z" />
              </svg>
              Apple
            </Button>
          </div>

          {/* Magic link */}
          <Button
            type="button"
            variant="outline"
            onClick={openMagic}
            className="w-full mt-4 dark:border-violet-600 dark:text-white"
          >
            <Mail className="w-5 h-5 mr-2 text-violet-600 dark:text-amber-400" />
            Email me a magic link
          </Button>

          {/* Sign Up Link */}
          <p className="text-center mt-8 text-gray-600 dark:text-gray-300">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-violet-600 dark:text-amber-400 font-medium hover:underline"
            >
              Sign up
            </Link>
          </p>

          {/* Student Link */}
          <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
            Are you a student?{' '}
            <Link
              to="/role-selection"
              className="text-violet-600 dark:text-amber-400 hover:underline"
            >
              Register as Student
            </Link>
          </p>
        </div>
      </div>

      {/* Magic link dialog */}
      <Dialog open={magicOpen} onOpenChange={setMagicOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Sign in with a magic link</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              No password needed — we email you a one-tap sign-in link.
            </DialogDescription>
          </DialogHeader>
          {magicStage === 'sent' ? (
            <div className="py-4 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto">
                <MailCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">Check your inbox</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
                We sent a sign-in link to {magicEmail}. It expires in 15 minutes.
              </p>
              <div className="mt-5 space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={resendIn > 0}
                  onClick={sendMagic}
                  className="w-full dark:border-violet-600 dark:text-white"
                >
                  {resendIn > 0 ? `Resend link in ${resendIn}s` : 'Resend link'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setMagicOpen(false);
                    fillDemo();
                    toast.info('Demo account filled in — sign in while you wait for the email');
                  }}
                  className="w-full text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"
                >
                  Use the demo account instead
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-1">
              <div>
                <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="magic-email"
                    type="email"
                    autoComplete="email"
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 dark:bg-violet-700 dark:border-violet-600"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        sendMagic();
                      }
                    }}
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={sendMagic}
                disabled={magicStage === 'sending'}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              >
                {magicStage === 'sending' ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Send magic link'
                )}
              </Button>
              <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
                Demo mode — no real email is sent. Any address works.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
