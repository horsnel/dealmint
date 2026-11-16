import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { X, Package, ShieldCheck, Search, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice, timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Listing } from '@/types';

/**
 * Apply for Task page (mock 350073, screen 1): task summary, price proposal,
 * delivery time picker, message to client, then the escrow + meetup extras
 * the app needs before an application can be funded.
 */

const DURATIONS = ['1 Hour', '2 Hours', 'Today'] as const;

export function ApplyTaskPage() {
  usePageTitle('Apply for Task');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    user,
    createOrder,
    requireVerified,
    safeSpots,
    getListing,
  } = useApp();

  const listing: Listing | undefined = getListing(id || '');
  const [offer, setOffer] = useState(listing ? String(listing.price) : '');
  const [timeline, setTimeline] = useState('');
  const [note, setNote] = useState('');
  const [meetupSpotId, setMeetupSpotId] = useState('none');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!listing || !user) {
    return (
      <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
        <div className="mx-auto max-w-md px-4 py-8">
          <EmptyState
            icon={Search}
            title="Task not found"
            description="This task may have been removed or the link is incorrect."
            action={
              <Link to="/browse">
                <Button className="bg-violet-600 hover:bg-violet-700">Browse tasks</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const citySpots = safeSpots.filter((s) => s.isApproved && s.lat != null && (!listing.location || s.city === listing.location));
  const selectedSpot = citySpots.find((s) => s.id === meetupSpotId);
  const amount = Number(offer);
  const balance = user.walletBalance ?? 0;
  const shortfall = Math.max(0, (Number.isFinite(amount) ? amount : 0) - balance);

  const submit = () => {
    if (!requireVerified('make an offer')) return;
    if (!user.phoneVerified) {
      toast.info('Verify your phone number first');
      navigate('/verify-phone', { state: { from: location.pathname } });
      return;
    }
    const e: Record<string, string> = {};
    if (!offer || !Number.isFinite(amount) || amount < 100) e.offer = 'Enter an amount of at least ₦100';
    if (amount > 100000000) e.offer = 'That amount looks too high';
    if (!timeline) e.timeline = 'Choose how long it will take';
    setErrors(e);
    if (Object.keys(e).length > 0) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    if (shortfall > 0) {
      toast.error(`You need ${formatPrice(shortfall)} more in your wallet to fund this offer. Top up from the Wallet page.`);
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const meetup = selectedSpot
        ? {
            spotId: selectedSpot.id,
            name: selectedSpot.name,
            address: selectedSpot.address,
            city: selectedSpot.city,
            lat: selectedSpot.lat ?? undefined,
          }
        : undefined;
      const result = createOrder(listing, [`Needed: ${timeline}.`, note.trim()].filter(Boolean).join(' '), amount, meetup);
      setSubmitting(false);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Application sent!');
      if (result.data) navigate(`/dashboard/orders/${result.data.id}`);
    }, 600);
  };

  const fieldError = (k: string) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
        {errors[k]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-lavender pt-20 lg:pt-24 dark:bg-violet-950">
      <div className="mx-auto max-w-md px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-violet-900/5 dark:border-violet-700 dark:bg-violet-900">
          {/* Header (mock: X + page title) */}
          <header className="flex items-center gap-4 border-b border-gray-100 px-4 py-4 dark:border-violet-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Close"
              className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-violet-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Apply for Task</h1>
          </header>

          <div className="space-y-6 p-5">
            {/* Task summary card (mock) */}
            <div className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-violet-700 dark:bg-violet-800">
              <div className="h-fit rounded-xl bg-orange-100 p-2.5 dark:bg-orange-500/15">
                <Package className="h-6 w-6 text-orange-600 dark:text-orange-300" />
              </div>
              <div className="min-w-0">
                <h2 className="mb-1 text-sm font-bold leading-tight text-gray-900 dark:text-white">{listing.title}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Posted by {listing.seller.name} · {timeAgo(listing.createdAt)}
                </p>
                <p className="mt-2 font-bold text-gray-900 dark:text-white">{formatPrice(listing.price)}</p>
              </div>
            </div>

            {/* Price proposal (mock) */}
            <div className="space-y-2">
              <label htmlFor="offer" className="block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Your Price Proposal
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 dark:text-gray-400">₦</span>
                <input
                  id="offer"
                  type="number"
                  inputMode="numeric"
                  min="100"
                  value={offer}
                  onChange={(e) => {
                    setOffer(e.target.value);
                    if (errors.offer) setErrors((er) => ({ ...er, offer: '' }));
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-9 pr-4 font-bold text-gray-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:border-violet-600 dark:bg-violet-800 dark:text-white"
                />
              </div>
              {fieldError('offer')}
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Client's budget is {formatPrice(listing.price)}. You can negotiate lower.
              </p>
            </div>

            {/* Delivery time (mock: 1 Hour / 2 Hours / Today) */}
            <div className="space-y-2">
              <span className="block text-sm font-semibold text-gray-700 dark:text-gray-200">How long will it take?</span>
              <div className="grid grid-cols-3 gap-2">
                {DURATIONS.map((d) => {
                  const active = timeline === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setTimeline(active ? '' : d);
                        if (errors.timeline) setErrors((er) => ({ ...er, timeline: '' }));
                      }}
                      className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                        active
                          ? 'border-2 border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-500/10 dark:text-orange-300'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-orange-500 hover:text-orange-600 dark:border-violet-600 dark:bg-violet-800 dark:text-gray-300 dark:hover:border-orange-400/60'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              {fieldError('timeline')}
            </div>

            {/* Message to client (mock) */}
            <div className="space-y-2">
              <label htmlFor="note" className="flex justify-between text-sm font-semibold text-gray-700 dark:text-gray-200">
                <span>Message to client</span>
                <span className="text-xs font-normal text-gray-400 dark:text-gray-500">Optional</span>
              </label>
              <textarea
                id="note"
                rows={4}
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={`Hi ${listing.seller.name.split(' ')[0]}, I am very close to ${listing.location || 'the pickup point'} and can pick this up immediately...`}
                className="w-full resize-none rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500 dark:border-violet-600 dark:bg-violet-800 dark:text-white"
              />
            </div>

            {/* Meetup point (kept from the app flow) */}
            <div>
              <Label className="dark:text-gray-200">Meetup point (optional)</Label>
              <p className="mb-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                Suggest a community Safe Spot to hand over in person: busy, public and well-lit.
              </p>
              <Select value={meetupSpotId} onValueChange={setMeetupSpotId}>
                <SelectTrigger className="dark:bg-violet-800 dark:border-violet-600">
                  <SelectValue placeholder="Choose a Safe Spot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No in-person meetup needed</SelectItem>
                  {citySpots.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}, {s.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Escrow note (the app funds escrow on apply) */}
            <div className="flex items-start gap-2.5 rounded-xl bg-green-50 p-3.5 dark:bg-green-900/20">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-300" />
              <p className="text-xs leading-relaxed text-green-800 dark:text-green-200">
                Submitting funds your proposal into escrow from your wallet ({formatPrice(balance)} available). The
                client releases it only after confirming the task is done.
              </p>
            </div>
            {shortfall > 0 && (
              <p className="flex items-center gap-2 text-xs font-semibold text-red-600 dark:text-red-400">
                <Wallet className="h-4 w-4" /> You need {formatPrice(shortfall)} more. Top up from the Wallet page.
              </p>
            )}
          </div>

          {/* Sticky bottom action (mock footer) */}
          <div className="border-t border-gray-100 bg-white p-4 pb-6 dark:border-violet-700 dark:bg-violet-900">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full rounded-xl bg-orange-500 py-3.5 text-lg font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
