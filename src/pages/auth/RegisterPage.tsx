import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { PasswordStrengthMeter } from '@/components/common/PasswordStrengthMeter';
import { isValidEmail, isValidNigerianPhone, normalizePhone, passwordStrength } from '@/lib/validation';
import { usePageTitle } from '@/hooks/usePageTitle';

export function RegisterPage() {
  usePageTitle('Create account');
  const navigate = useNavigate();
  const { user, register, oauthSignIn, authMode } = useApp();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    agreeTerms: false,
  });
  // Referral program: friends share a code like EMEK-047
  const [referralCode, setReferralCode] = useState(() => new URLSearchParams(window.location.search).get('ref') || '');
  const role: 'student' | 'general' =
    localStorage.getItem('dealmint_selected_role') === 'student' ? 'student' : 'general';

  useEffect(() => {
    if (user && !isLoading) navigate('/dashboard', { replace: true });
  }, [user, isLoading, navigate]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (formData.name.trim().length < 2) e.name = 'Enter your full name';
    if (!isValidEmail(formData.email)) e.email = 'Enter a valid email address';
    if (!isValidNigerianPhone(formData.phone)) e.phone = 'Enter a valid Nigerian number, e.g. 0803 123 4567';
    if (!passwordStrength(formData.password).valid) e.password = 'Use 8+ characters with at least one letter and one number';
    if (formData.confirm !== formData.password) e.confirm = 'Passwords do not match';
    if (!formData.agreeTerms) e.terms = 'Please agree to the Terms and Privacy Policy';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setIsLoading(true);
    try {
      const result = await register({
        name: formData.name,
        email: formData.email,
        phone: normalizePhone(formData.phone),
        password: formData.password,
        role,
        referralCode: referralCode.trim() || undefined,
      });
      if (!result.ok) {
        setIsLoading(false);
        setErrors({ email: result.error });
        return;
      }
      localStorage.removeItem('dealmint_selected_role');
      toast.success(
        authMode === 'cloud'
          ? 'Account created! Check your inbox for a verification link.'
          : 'Account created successfully!'
      );
      navigate('/verify-phone', { replace: true });
    } catch {
      setIsLoading(false);
      toast.error('Something went wrong. Please try again.');
    }
  };

  const fieldError = (k: string) =>
    errors[k] ? (
      <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">
        {errors[k]}
      </p>
    ) : null;

  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2';
  const inputClass = 'pl-10 dark:bg-violet-700 dark:border-violet-600';
  const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400';

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 lg:py-16">
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Join Dealmint and start earning or hiring
            </p>
          </div>

          {role === 'student' && (
            <div className="mb-6 rounded-xl bg-violet-50 dark:bg-violet-700/50 p-3 text-sm text-violet-800 dark:text-violet-100">
              Signing up as a student. You get the lower 10% commission.{' '}
              <Link to="/role-selection" className="font-semibold underline">Change</Link>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label htmlFor="name" className={labelClass}>Full Name</label>
              <div className="relative">
                <User className={iconClass} />
                <Input
                  id="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className={inputClass}
                />
              </div>
              {fieldError('name')}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className={iconClass} />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
              {fieldError('email')}
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone className={iconClass} />
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+234 800 123 4567"
                  className={inputClass}
                />
              </div>
              {fieldError('phone')}
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>Password</label>
              <div className="relative">
                <Lock className={iconClass} />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="pl-10 pr-10 dark:bg-violet-700 dark:border-violet-600"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrengthMeter password={formData.password} />
              {fieldError('password')}
            </div>

            <div>
              <label htmlFor="confirm" className={labelClass}>Confirm Password</label>
              <div className="relative">
                <Lock className={iconClass} />
                <Input
                  id="confirm"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirm}
                  onChange={(e) => setFormData({ ...formData, confirm: e.target.value })}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              {fieldError('confirm')}
            </div>

            <div>
              <label htmlFor="referral" className={labelClass}>
                Referral code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Gift className={iconClass} />
                <Input
                  id="referral"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DEMO-123"
                  className={`${inputClass} font-mono uppercase`}
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={formData.agreeTerms}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, agreeTerms: checked as boolean })
                }
              />
              <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-300">
                I agree to the{' '}
                <Link to="/terms" className="text-violet-600 dark:text-amber-400 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-violet-600 dark:text-amber-400 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {fieldError('terms')}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
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
              onClick={() => oauthSignIn('google')}
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
              onClick={() => oauthSignIn('apple')}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zm-5.85-15.1c.07-2.04 1.76-3.79 3.78-3.94.29 2.32-1.93 4.48-3.78 3.94z" />
              </svg>
              Apple
            </Button>
          </div>

          {/* Login Link */}
          <p className="text-center mt-8 text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-violet-600 dark:text-amber-400 font-medium hover:underline"
            >
              Sign in
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
    </div>
  );
}
