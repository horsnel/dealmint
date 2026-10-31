import { useState } from 'react';
import { Copy, Gift, Mail, MessageCircle, PartyPopper, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { formatDate, formatPrice } from '@/lib/format';
import { REFERRAL_REWARD } from '@/lib/referral';
import { usePageTitle } from '@/hooks/usePageTitle';

export function ReferralsPage() {
  usePageTitle('Referrals');
  const { user, myReferralCode, referrals, inviteReferral } = useApp();
  const [email, setEmail] = useState('');
  const [inviteError, setInviteError] = useState('');

  if (!user) return null;

  const stats = {
    invited: referrals.filter((r) => r.status === 'invited').length,
    joined: referrals.filter((r) => r.status === 'joined').length,
    rewarded: referrals.filter((r) => r.status === 'rewarded').length,
    earned: referrals.filter((r) => r.status === 'rewarded').reduce((s, r) => s + r.reward, 0),
  };

  const shareText = `Join me on Dealmint — Nigeria's marketplace for gigs, tasks and services. Use my code ${myReferralCode} when you sign up: ${window.location.origin}/register`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(myReferralCode);
      toast.success('Referral code copied');
    } catch {
      toast.error('Could not copy. Long-press the code to copy it instead.');
    }
  };

  const shareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleInvite = () => {
    const res = inviteReferral(email);
    if (!res.ok) return setInviteError(res.error);
    setInviteError('');
    setEmail('');
    toast.success(`Invite recorded — ${email} gets your code when they sign up`);
  };

  const statusChip = (status: 'invited' | 'joined' | 'rewarded') => {
    const map = {
      invited: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30',
      joined: 'text-violet-700 dark:text-violet-100 bg-violet-100 dark:bg-violet-700/60',
      rewarded: 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30',
    };
    return map[status];
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-2">
          Refer &amp; Earn
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Earn {formatPrice(REFERRAL_REWARD)} in wallet credit for every friend who joins and completes their first order.
        </p>

        {/* Code card */}
        <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-violet-800 p-6 lg:p-8 text-white mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-violet-200 text-sm">Your referral code</p>
              <p className="font-mono font-bold text-3xl lg:text-4xl tracking-[0.2em] mt-1 break-all">
                {myReferralCode}
              </p>
              <p className="text-violet-200 text-xs mt-2">
                Friends enter this code on the sign-up page.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <Button onClick={copyCode} variant="secondary" className="bg-white text-violet-700 hover:bg-gray-100 rounded-full">
                <Copy className="w-4 h-4 mr-2" />
                Copy code
              </Button>
              <Button onClick={shareWhatsApp} className="bg-green-500 hover:bg-green-600 text-white rounded-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Share on WhatsApp
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Invites sent', value: String(stats.invited), icon: Mail },
            { label: 'Signed up', value: String(stats.joined), icon: Users },
            { label: 'Rewarded', value: String(stats.rewarded), icon: PartyPopper },
            { label: 'Earned', value: formatPrice(stats.earned), icon: Wallet },
          ].map((s) => (
            <div key={s.label} className="card-white dark:bg-violet-800 dark:border-violet-700 p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center shrink-0">
                  <s.icon className="w-4 h-4 text-violet-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{s.label}</p>
                  <p className="font-bold text-gray-900 dark:text-white truncate">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-600 dark:text-amber-400" />
            How it works
          </h2>
          <ol className="space-y-3">
            {[
              'Share your code with friends on WhatsApp, X or in person.',
              `They enter the code when signing up — you get a notification instantly.`,
              `When they complete their first order, ${formatPrice(REFERRAL_REWARD)} lands in your wallet automatically.`,
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-600 dark:text-gray-300">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Invite by email */}
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 mb-8">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Invite by email</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            We will keep track of the invite and match it to their sign-up.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setInviteError('');
              }}
              placeholder="friend@example.com"
              aria-label="Friend's email address"
              className="flex-1 min-w-0 dark:bg-violet-700 dark:border-violet-600"
            />
            <Button onClick={handleInvite} className="bg-violet-600 hover:bg-violet-700 shrink-0">
              <Mail className="w-4 h-4 mr-2" />
              Send invite
            </Button>
          </div>
          {inviteError && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400 mt-2">
              {inviteError}
            </p>
          )}
        </div>

        {/* History */}
        <div>
          <h2 className="font-display font-semibold text-xl text-gray-900 dark:text-white mb-4">
            Your referrals
          </h2>
          {referrals.length === 0 ? (
            <div className="card-white dark:bg-violet-800 dark:border-violet-700">
              <EmptyState
                icon={Users}
                title="No referrals yet"
                description="Share your code to start earning. Every completed order from a friend pays you."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((r) => (
                <div
                  key={r.id}
                  className="card-white dark:bg-violet-800 dark:border-violet-700 p-4 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {r.invitedName || r.invitedEmail}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(r.createdAt)} · reward {formatPrice(r.reward)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-1 ${statusChip(r.status)}`}
                  >
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
