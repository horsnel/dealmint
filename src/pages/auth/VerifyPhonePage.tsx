import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Phone, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useApp } from '@/context/AppContext';
import { usePageTitle } from '@/hooks/usePageTitle';

const makeCode = () => String(Math.floor(100000 + Math.random() * 900000));

export function VerifyPhonePage() {
  usePageTitle('Verify phone');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, verifyPhone } = useApp();
  const next = (location.state as { from?: string } | null)?.from || '/dashboard';
  const codeRef = useRef(makeCode());
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(30);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  // A real SMS would arrive here. For this prototype the code is shown on screen.
  useEffect(() => {
    toast.info(`Demo code: ${codeRef.current}`, { duration: 15000 });
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = (code: string) => {
    if (code.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }
    if (code !== codeRef.current) {
      setError('That code is not correct. Try again.');
      setValue('');
      return;
    }
    verifyPhone();
    setDone(true);
    toast.success('Phone number verified!');
    setTimeout(() => navigate(next, { replace: true }), 900);
  };

  const resend = () => {
    codeRef.current = makeCode();
    setCooldown(30);
    setValue('');
    setError('');
    toast.info(`Demo code: ${codeRef.current}`, { duration: 15000 });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-md mx-auto px-4 sm:px-6 py-8 lg:py-16">
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center">
            {done ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <Phone className="w-8 h-8 text-violet-600 dark:text-violet-200" />
            )}
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-2">
            {done ? 'Phone verified' : 'Verify your phone'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {done
              ? 'You are all set.'
              : `We sent a 6-digit code to ${user.phone || 'your phone'}. Enter it below.`}
          </p>

          {!done && (
            <>
              <div className="flex justify-center mb-3">
                <InputOTP
                  maxLength={6}
                  value={value}
                  onChange={(v) => {
                    setValue(v);
                    setError('');
                    if (v.length === 6) submit(v);
                  }}
                >
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400 mb-3">
                  {error}
                </p>
              )}

              <Button
                onClick={() => submit(value)}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white mt-3"
              >
                Verify
              </Button>

              <button
                onClick={resend}
                disabled={cooldown > 0}
                className="mt-4 text-sm text-violet-600 dark:text-amber-400 hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </button>

              <div className="mt-6 pt-6 border-t dark:border-violet-700">
                <button
                  onClick={() => navigate(next, { replace: true })}
                  className="text-sm text-gray-500 dark:text-gray-400 hover:underline"
                >
                  Skip for now
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  You need a verified number to place orders.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
