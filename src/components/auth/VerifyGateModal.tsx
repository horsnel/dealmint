import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

/**
 * Hard gate for actions that need a confirmed email address (ordering in
 * cloud mode). Opens when requireVerified() refuses an action; offers a
 * resend and hands off to /verify-email for the full explanation.
 */
export function VerifyGateModal() {
  const navigate = useNavigate();
  const { user, verifyGate, closeVerifyGate, sendEmailVerification } = useApp();
  const [sending, setSending] = useState(false);

  const open = verifyGate !== null;

  const resend = async () => {
    setSending(true);
    const r = await sendEmailVerification();
    setSending(false);
    if (r.ok) toast.success(`Verification email sent to ${user?.email || 'your address'}`);
    else toast.error(r.error);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeVerifyGate();
      }}
    >
      <DialogContent className="dark:bg-violet-900 dark:border-violet-700 sm:max-w-md">
        <DialogHeader>
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto">
            <MailCheck className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>
          <DialogTitle className="text-center dark:text-white mt-2">
            Confirm your email to {verifyGate}
          </DialogTitle>
          <DialogDescription className="text-center dark:text-gray-300">
            To keep the marketplace safe, every account confirms its email address before it can{' '}
            {verifyGate}. We sent a verification link to{' '}
            <span className="font-medium text-gray-900 dark:text-white break-all">
              {user?.email || 'your address'}
            </span>
            .
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            type="button"
            onClick={resend}
            disabled={sending}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending…
              </>
            ) : (
              'Resend verification email'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full dark:border-violet-600 dark:text-white"
            onClick={() => {
              closeVerifyGate();
              navigate('/verify-email');
            }}
          >
            Open verification page
          </Button>
        </div>
        <p className="text-[11px] text-center text-gray-400 dark:text-gray-500">
          Click the link in the email — ordering unlocks instantly.
        </p>
      </DialogContent>
    </Dialog>
  );
}
