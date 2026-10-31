import { useEffect, useRef, useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/format';

// Mock Paystack checkout (borrowed pattern from Postall's paystack routes):
// no real keys in this prototype, so the initialize → checkout → verify flow
// is simulated locally. Swapping in live payments later means calling the real
// initialize endpoint and opening authorization_url instead of this overlay.

interface PaystackModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  email: string;
  description: string;
}

export function PaystackModal({ open, onClose, onSuccess, amount, email, description }: PaystackModalProps) {
  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');
  const [card, setCard] = useState('4084 0840 8408 4081');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('408');
  const timer = useRef<number | null>(null);

  // Reset each time it opens
  useEffect(() => {
    if (open) {
      setStage('form');
      setCard('4084 0840 8408 4081');
      setExpiry('12/28');
      setCvv('408');
    }
  }, [open]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  if (!open) return null;

  const pay = () => {
    setStage('processing');
    timer.current = window.setTimeout(() => {
      setStage('success');
      timer.current = window.setTimeout(() => {
        onSuccess();
        onClose();
      }, 1100);
    }, 1500);
  };

  const reference = `PSK_${Date.now().toString(36).toUpperCase()}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Secure checkout"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && stage !== 'processing') onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && stage !== 'processing') onClose();
      }}
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-violet-900 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-violet-700 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-[#011B33] dark:bg-violet-700 flex items-center justify-center shrink-0" aria-hidden="true">
              <span className="flex gap-[2px]">
                <span className="w-1 h-1 rounded-full bg-[#0EA5E9]" />
                <span className="w-1 h-1 rounded-full bg-[#0EA5E9]" />
                <span className="w-1 h-1 rounded-full bg-[#0EA5E9]" />
              </span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">Paystack Checkout</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight truncate">{email}</p>
            </div>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300 rounded-full px-2 py-1">
            <Lock className="w-3 h-3" aria-hidden="true" />
            Test mode
          </span>
          <button
            type="button"
            aria-label="Close checkout"
            onClick={() => stage !== 'processing' && onClose()}
            className="shrink-0 ml-2 w-9 h-9 -mr-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-violet-800 dark:hover:bg-violet-700 text-gray-600 dark:text-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-5 overflow-y-auto min-h-0">
          {stage === 'success' ? (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-9 h-9 text-green-600 dark:text-green-400" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold text-lg text-gray-900 dark:text-white">Payment successful</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{formatPrice(amount)} paid · Ref {reference}</p>
            </div>
          ) : (
            <>
              <div className="flex items-baseline justify-between mb-1">
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate pr-2">{description}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-5">{formatPrice(amount)}</p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="ps-card" className="dark:text-gray-200 text-xs">Card number</Label>
                  <Input
                    id="ps-card"
                    value={card}
                    onChange={(e) => setCard(e.target.value)}
                    inputMode="numeric"
                    disabled={stage === 'processing'}
                    className="mt-1 font-mono dark:bg-violet-700 dark:border-violet-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="ps-exp" className="dark:text-gray-200 text-xs">Expiry</Label>
                    <Input
                      id="ps-exp"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      disabled={stage === 'processing'}
                      className="mt-1 font-mono dark:bg-violet-700 dark:border-violet-600"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ps-cvv" className="dark:text-gray-200 text-xs">CVV</Label>
                    <Input
                      id="ps-cvv"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      disabled={stage === 'processing'}
                      className="mt-1 font-mono dark:bg-violet-700 dark:border-violet-600"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={pay}
                disabled={stage === 'processing'}
                className="w-full mt-6 h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
              >
                {stage === 'processing' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    Processing...
                  </span>
                ) : (
                  `Pay ${formatPrice(amount)}`
                )}
              </Button>
              <p className="mt-3 text-[11px] text-center text-gray-400 dark:text-gray-500">
                Demo checkout — no real charge. Test card is pre-filled.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
