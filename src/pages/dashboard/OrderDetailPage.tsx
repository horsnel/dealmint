import { useState, useRef } from 'react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Check,
  CheckCircle,
  CheckCircle2,
  Circle,
  Camera,
  Download,
  Lock,
  MapPin,
  MessageSquare,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageClose } from '@/components/common/PageClose';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { SlideToConfirm } from '@/components/common/SlideToConfirm';
import { OrderStatusBadge, orderStatusLabel } from '@/components/common/OrderStatusBadge';
import { StarInput } from '@/components/common/Stars';
import { ReviewTags, useReviewTags } from '@/components/common/ReviewTags';
import { formatDate, formatPrice, formatTime } from '@/lib/format';
import { compressImage } from '@/lib/image';
import { typeLabel } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Order, OrderStatus } from '@/types';

const stepText: Record<string, string> = {
  pending: 'Order placed. Payment is held in escrow.',
  in_progress: 'Seller accepted and started work.',
  delivered: 'Seller delivered the work.',
  completed: 'Order completed and payment released.',
  cancelled: 'Order cancelled and payment refunded.',
  disputed: 'A dispute was opened.',
};

function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // History-aware back: behaves like the browser back button, with a
  // sensible fallback when the page was opened directly (no history).
  const {
    user,
    orders,
    acceptOrder,
    declineOrder,
    deliverOrder,
    completeOrder,
    cancelOrder,
    disputeOrder,
    withdrawDispute,
    simulateSeller,
    recordDownload,
    addReview,
    startConversation,
    sendMessage,
    conversations,
    getListing,
  } = useApp();

  const order: Order | undefined = orders.find((o) => o.id === id);
  usePageTitle(order ? `Order: ${order.listingTitle}` : 'Order');

  const [deliverOpen, setDeliverOpen] = useState(false);
  const [deliverNote, setDeliverNote] = useState('');
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [confirm, setConfirm] = useState<null | 'cancel' | 'decline' | 'complete'>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const reviewTags = useReviewTags();
  // Quick chat (workspace mock a1a748) + task proof-of-delivery photo (mock 350073 screen 2)
  const [quickMsg, setQuickMsg] = useState('');
  const [proof, setProof] = useState<string | null>(null);
  const proofInput = useRef<HTMLInputElement>(null);

  if (!order || !user) {
    return (
      <DashboardShell>
        <div>
          <EmptyState
            icon={Search}
            title="Order not found"
            description="It may belong to a different account."
            action={
              <Link to="/dashboard/orders">
                <Button className="bg-violet-600 hover:bg-violet-700">Back to orders</Button>
              </Link>
            }
          />
        </div>
      </DashboardShell>
    );
  }

  const isBuyer = order.buyerId === user.id;
  const isSeller = order.sellerId === user.id;
  const other = isBuyer
    ? { id: order.sellerId, name: order.sellerName, avatar: order.sellerAvatar }
    : { id: order.buyerId, name: order.buyerName, avatar: order.buyerAvatar };
  const listing = getListing(order.listingId);
  const net = order.price - order.fee;
  const escrowHeld = ['pending', 'in_progress', 'delivered', 'disputed'].includes(order.status);

  // ---------- escrow stepper ----------
  const eventAt = (s: OrderStatus) => {
    const e = [...order.timeline].reverse().find((x) => x.status === s);
    return e?.at;
  };
  const fmtWhen = (iso?: string) => (iso ? `${formatDate(iso)} · ${formatTime(iso)}` : undefined);

  type Stage = { title: string; desc: string; state: 'done' | 'current' | 'pending'; when?: string; tone?: 'green' };

  const deliveredSeen = order.timeline.some((e) => e.status === 'delivered');
  let stages: Stage[];
  if (order.status === 'cancelled') {
    stages = [
      {
        title: 'Payment in escrow',
        desc: `${formatPrice(order.price)} was paid into escrow.`,
        state: 'done',
        when: fmtWhen(eventAt('pending')),
      },
      {
        title: 'Order cancelled',
        desc: `A refund of ${formatPrice(order.price)} was sent to the buyer's wallet.`,
        state: 'done',
        tone: 'green',
        when: fmtWhen(eventAt('cancelled')),
      },
    ];
  } else {
    const progressDone = ['in_progress', 'delivered', 'completed', 'disputed'].includes(order.status) || deliveredSeen;
    const deliveredDone = ['delivered', 'completed'].includes(order.status) || (order.status === 'disputed' && deliveredSeen);
    const releasedDone = order.status === 'completed';
    stages = [
      {
        title: 'Payment in escrow',
        desc: `${formatPrice(order.price)} is held safely by Dealmint, not sent to the seller yet.`,
        state: 'done',
        when: fmtWhen(eventAt('pending')),
      },
      {
        title: order.listingType === 'job' ? 'Accepted & working' : 'Seller accepted & started',
        desc: progressDone
          ? 'Work is under way.'
          : isBuyer
            ? 'Waiting for the seller to accept. Your money stays in escrow until they do.'
            : 'Accept this order to start working.',
        state: progressDone ? 'done' : 'current',
        when: progressDone ? fmtWhen(eventAt('in_progress')) : undefined,
      },
      {
        title: 'Work delivered',
        desc: deliveredDone
          ? isBuyer
            ? 'Review the delivery below before releasing payment.'
            : 'Waiting for the buyer to review your delivery.'
          : isBuyer
            ? 'Money stays in escrow until you confirm you are happy.'
            : 'Deliver the work so the buyer can release your payment.',
        state: deliveredDone ? 'done' : progressDone ? 'current' : 'pending',
        when: deliveredDone ? fmtWhen(eventAt('delivered')) : undefined,
      },
      {
        title: 'Payment released',
        desc: releasedDone
          ? isBuyer
            ? `${formatPrice(net)} was released to ${order.sellerName}.`
            : `You earned ${formatPrice(net)} from this order.`
          : order.status === 'disputed'
            ? 'Funds stay locked in escrow until the dispute is resolved.'
            : isBuyer
              ? 'Confirm delivery to release the payment, or open a dispute. The money stays locked either way.'
              : 'You get paid the moment the buyer confirms.',
        state: releasedDone ? 'done' : deliveredDone ? 'current' : 'pending',
        when: releasedDone ? fmtWhen(order.completedAt) : undefined,
        tone: releasedDone ? 'green' : undefined,
      },
    ];
  }

  const message = () => {
    const cid = startConversation(other, listing);
    if (cid) navigate(`/dashboard/messages?c=${cid}`);
  };

  // Workspace chat preview: the existing conversation about this listing
  const convo = conversations.find(
    (c) =>
      c.listingId === order.listingId &&
      ((c.userId === user.id && c.otherId === other.id) || (c.otherId === user.id && c.userId === other.id))
  );

  const quickSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = quickMsg.trim();
    if (!text) return;
    const cid = convo?.id || startConversation(other, listing);
    if (!cid) {
      toast.error('Could not open the conversation');
      return;
    }
    sendMessage(cid, text);
    setQuickMsg('');
  };

  const pickProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error('Photos must be 8 MB or smaller');
      return;
    }
    try {
      setProof(await compressImage(f));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not use that photo');
    }
  };

  const scrollToReview = () => {
    document.getElementById('order-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const submitDelivery = () => {
    if (deliverNote.trim().length < 10) return toast.error('Add a short note (at least 10 characters) about what you are delivering');
    const fullNote = proof ? `${deliverNote.trim()} (photo proof attached)` : deliverNote.trim();
    deliverOrder(order.id, fullNote);
    setDeliverOpen(false);
    setDeliverNote('');
    setProof(null);
    toast.success('Delivered. The buyer has been notified.');
  };

  const submitDispute = () => {
    if (disputeReason.trim().length < 10) return toast.error('Tell us what went wrong (at least 10 characters)');
    disputeOrder(order.id, disputeReason.trim());
    setDisputeOpen(false);
    setDisputeReason('');
    toast.success('Dispute opened. Your payment stays in escrow while we review.');
  };

  const submitReview = () => {
    const text = reviewTags.fold(comment).trim();
    if (text.length < 10) return toast.error('Please write at least 10 characters');
    const res = addReview(order.id, rating, text);
    if (!res.ok) return toast.error(res.error);
    toast.success('Thanks for your review!');
    setComment('');
    reviewTags.reset();
  };

  const releasePayment = () => {
    completeOrder(order.id);
    toast.success('Payment released to the seller');
  };

  const runConfirm = () => {
    if (confirm === 'cancel') {
      cancelOrder(order.id);
      toast.success('Order cancelled and the payment was refunded');
    } else if (confirm === 'decline') {
      declineOrder(order.id);
      toast.success('Order declined. The buyer was refunded.');
    } else if (confirm === 'complete') {
      releasePayment();
    }
    setConfirm(null);
  };

  const receipt = () => {
    downloadText(
      `dealmint-receipt-${order.id}.txt`,
      [
        'DEALMINT RECEIPT',
        '----------------',
        `Order: ${order.id}`,
        `Item: ${order.listingTitle}`,
        `Buyer: ${order.buyerName}`,
        `Seller: ${order.sellerName}`,
        `Amount: ${formatPrice(order.price)}`,
        `Platform fee: ${formatPrice(order.fee)}`,
        `Status: ${orderStatusLabel(order.status)}`,
        `Date: ${formatDate(order.createdAt)}`,
      ].join('\n')
    );
  };

  const downloadProduct = () => {
    recordDownload(order.id);
    downloadText(
      `${(listing?.fileName || order.listingTitle).replace(/[^a-z0-9._-]+/gi, '_')}-license.txt`,
      [
        `Licence for: ${order.listingTitle}`,
        `Licensed to: ${order.buyerName}`,
        `Order: ${order.id}`,
        `Download token: ${order.downloadToken || 'n/a'}`,
        order.downloads ? `Previous downloads: ${order.downloads}` : '',
        '',
        'Prototype note: the original product file is not stored in this demo build.',
        'In production this button downloads the file uploaded by the seller.',
      ].filter(Boolean).join('\n')
    );
    toast.success('Download started. Link secured with your token');
  };

  // Auto-release date (7 days after funding, Postall-style)
  const autoReleaseAt = new Date(Date.parse(order.createdAt) + 7 * 86400000);
  const feeRate = order.price > 0 ? Math.round((order.fee / order.price) * 100) : 0;

  return (
    <DashboardShell>
      <div>
        <PageClose fallback="/dashboard/orders" />
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
            Order details
          </h1>
          <OrderStatusBadge status={order.status} />
          {escrowHeld && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-full px-2.5 py-1">
              <Lock className="w-3 h-3" />
              Funds in escrow
            </span>
          )}
        </div>

        {/* Completion receipt — mock 5ce84e screen 3: ring check, receipt card, actions */}
        {order.status === 'completed' && (
          <div className="mb-6 rounded-3xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-violet-700 dark:bg-violet-800">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 shadow-inner dark:bg-green-500/15">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/40">
                <Check className="h-8 w-8 text-white" strokeWidth={3} />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
              {order.listingType === 'task' ? 'Task Completed!' : 'Order Completed!'}
            </h2>
            <p className="mb-8 px-4 text-sm text-gray-500 dark:text-gray-400">
              {isSeller
                ? `${other.name} has confirmed delivery. Your earnings have been added to your wallet.`
                : `You confirmed delivery. ${formatPrice(order.price)} was released to ${order.sellerName}.`}
            </p>

            {/* Receipt card */}
            <div className="mx-auto mb-6 w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm dark:border-violet-700 dark:bg-violet-800">
              <h3 className="mb-4 border-b border-gray-100 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:border-violet-700 dark:text-gray-500">
                Payment Receipt
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    {isSeller ? (order.listingType === 'task' ? 'Task Amount' : 'Order Amount') : 'Amount Paid'}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(order.price)}</span>
                </div>
                {isSeller && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Service Fee ({feeRate}%)</span>
                    <span className="font-medium text-red-500">-{formatPrice(order.fee)}</span>
                  </div>
                )}
                <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 dark:border-violet-700">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    {isSeller ? 'Total Earned' : 'Total'}
                  </span>
                  <span className="text-base font-bold text-green-600 dark:text-green-300">
                    {formatPrice(isSeller ? net : order.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Next actions (mock: Rate + Back to Dashboard) */}
            <div className="mx-auto w-full max-w-sm space-y-3">
              {isBuyer && (
                <Button
                  onClick={scrollToReview}
                  className="w-full bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700"
                >
                  <Star className="mr-2 h-5 w-5" />
                  {order.reviewed ? 'View Your Review' : 'Rate Seller'}
                </Button>
              )}
              <Link to="/dashboard/orders" className="block">
                <Button variant="outline" className="w-full dark:border-violet-600 dark:text-white">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Escrow banner — "Payment Secured" from the workspace mock */}
        {escrowHeld && (
          <div className="mb-6 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3.5 flex gap-3 items-start">
            <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-300 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold text-green-800 dark:text-green-200">Payment secured</p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                {formatPrice(order.price)} is safely held by Dealmint
                {isBuyer
                  ? `. It will only be released to ${order.sellerName} when you confirm the work.`
                  : ', and it will be released to you upon approval.'}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Item */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5 flex items-center gap-4">
              <img
                src={order.listingImage || '/images/placeholder.jpg'}
                alt=""
                className="w-20 h-20 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{typeLabel(order.listingType)} · Order #{order.id.slice(-6).toUpperCase()}</p>
                {listing ? (
                  <Link to={`/listing/${listing.id}`} className="inline-block py-1.5 -my-1.5 font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-amber-400 line-clamp-2">
                    {order.listingTitle}
                  </Link>
                ) : (
                  <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">{order.listingTitle}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isBuyer ? 'Seller' : 'Buyer'}:{' '}
                  <Link to={`/seller/${other.id}`} className="inline-block py-2 -my-2 hover:underline">
                    {other.name}
                  </Link>
                </p>
              </div>
            </div>

            {/* Escrow & progress */}
            {order.listingType !== 'job' && (
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">Escrow &amp; progress</h3>
                {escrowHeld ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-full px-2.5 py-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {formatPrice(order.price)} in escrow
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-violet-700/40 rounded-full px-2.5 py-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    No funds in escrow
                  </span>
                )}
              </div>
              <ol>
                {stages.map((s, i) => (
                  <li key={s.title} className="relative flex gap-3 pb-6 last:pb-0">
                    {i < stages.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${
                          s.state === 'done'
                            ? 'bg-violet-500 dark:bg-amber-400'
                            : 'bg-gray-200 dark:bg-violet-700'
                        }`}
                      />
                    )}
                    <span
                      aria-hidden="true"
                      className={`relative z-10 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        s.state === 'done'
                          ? s.tone === 'green'
                            ? 'bg-green-500 text-white'
                            : 'bg-violet-600 text-white dark:bg-amber-400 dark:text-violet-950'
                          : s.state === 'current'
                            ? 'border-2 border-violet-600 dark:border-amber-400 text-violet-600 dark:text-amber-400 bg-white dark:bg-violet-800'
                            : 'border-2 border-gray-200 dark:border-violet-700 text-gray-300 dark:text-violet-600'
                      }`}
                    >
                      {s.state === 'done' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : s.state === 'current' ? (
                        <span className="relative flex items-center justify-center w-full h-full">
                          <span
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full bg-violet-400 dark:bg-amber-400 opacity-50 animate-ping"
                          />
                          <span className="relative w-2 h-2 rounded-full bg-current" />
                        </span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-current" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p
                          className={`font-medium leading-snug ${
                            s.state === 'pending' ? 'text-gray-400 dark:text-violet-500' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {s.title}
                        </p>
                        {s.state === 'done' && (
                          <span className="text-[10px] font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
                            Done
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-sm leading-snug ${
                          s.state === 'pending' ? 'text-gray-400 dark:text-violet-600' : 'text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {s.desc}
                      </p>
                      {s.when && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.when}</p>}
                    </div>
                  </li>
                ))}
              </ol>
              {order.status === 'disputed' && (
                <div className="mt-4 flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                  <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                  Dispute under review. {formatPrice(order.price)} stays locked in escrow until this is resolved.
                </div>
              )}
              {escrowHeld && (
                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  Auto-releases to the seller on {formatDate(autoReleaseAt.toISOString())} unless you confirm the delivery earlier.
                </p>
              )}
            </div>
            )}

            {/* Project milestones (workspace mock a1a748) — job orders use the milestone tracker */}
            {order.listingType === 'job' && order.status !== 'cancelled' && (
              <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Project Milestones
                </h3>
                <ol className="relative ml-1 space-y-6 border-l-2 border-gray-100 pb-2 dark:border-violet-700">
                  {stages.map((s) => (
                    <li key={s.title} className="relative pl-8">
                      <span
                        aria-hidden="true"
                        className={`absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow ${
                          s.state === 'done'
                            ? s.tone === 'green'
                              ? 'bg-green-500 text-white'
                              : 'bg-violet-600 text-white dark:bg-amber-400 dark:text-violet-950'
                            : s.state === 'current'
                              ? 'bg-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-500/20'
                              : 'bg-gray-200 text-gray-400 dark:bg-violet-700 dark:text-violet-400'
                        }`}
                      >
                        {s.state === 'done' ? (
                          <Check className="h-4 w-4" />
                        ) : s.state === 'current' ? (
                          order.status === 'in_progress' && isSeller ? (
                            <Upload className="h-4 w-4" />
                          ) : (
                            <span className="h-2 w-2 rounded-full bg-current" />
                          )
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-current" />
                        )}
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm font-bold ${
                            s.state === 'pending'
                              ? 'text-gray-400 dark:text-violet-500'
                              : s.state === 'current' && order.status === 'in_progress'
                                ? 'text-blue-600 dark:text-blue-300'
                                : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {s.title}
                        </p>
                        {(s.title === 'Payment in escrow' || s.title === 'Payment released') && (
                          <span
                            className={`text-xs font-bold ${
                              s.title === 'Payment released' ? 'text-green-600 dark:text-green-300' : 'text-violet-600 dark:text-amber-400'
                            }`}
                          >
                            {formatPrice(s.title === 'Payment released' ? net : order.price)}
                          </span>
                        )}
                      </div>
                      <p className={`mt-0.5 text-xs ${s.state === 'pending' ? 'text-gray-400 dark:text-violet-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {s.desc}
                      </p>
                      {s.when && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{s.when}</p>}
                    </li>
                  ))}
                </ol>
                {isSeller && order.status === 'in_progress' && (
                  <Button
                    onClick={() => setDeliverOpen(true)}
                    className="mt-3 w-full bg-blue-600 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    <Upload className="mr-1 h-3 w-3" /> Submit Work
                  </Button>
                )}
                {escrowHeld && (
                  <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Auto-releases to the seller on {formatDate(autoReleaseAt.toISOString())} unless you confirm earlier.
                  </p>
                )}
                {order.status === 'disputed' && (
                  <p className="mt-3 flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    Dispute under review. {formatPrice(order.price)} stays locked in escrow until resolved.
                  </p>
                )}
              </div>
            )}

            {/* Proof of delivery (mock 350073 screen 2) — task orders, seller side */}
            {isSeller && order.listingType === 'task' && order.status === 'in_progress' && (
              <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
                <h3 className="mb-1 font-bold text-gray-900 dark:text-white">Mark as Delivered</h3>
                <p className="mb-4 text-xs text-gray-600 dark:text-gray-300">
                  Please upload a photo of the package at the destination or a receipt as proof.
                </p>
                <button
                  type="button"
                  onClick={() => proofInput.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/70 py-6 text-orange-600 transition hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/20"
                >
                  {proof ? (
                    <>
                      <img src={proof} alt="Proof preview" className="mb-2 h-24 rounded-lg object-cover" />
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4" /> Proof added. Tap to change
                      </span>
                    </>
                  ) : (
                    <>
                      <Camera className="mb-2 h-6 w-6" />
                      <span className="text-sm font-semibold">Upload Photo Proof</span>
                    </>
                  )}
                </button>
                <input ref={proofInput} type="file" accept="image/*" onChange={pickProof} className="hidden" />
                <Button
                  onClick={() => setDeliverOpen(true)}
                  className="mt-4 w-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
                >
                  Mark as Delivered
                </Button>
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setConfirm('cancel')}
                    className="text-sm font-medium text-red-500 hover:underline"
                  >
                    Cancel Task
                  </button>
                </div>
              </div>
            )}

            {/* Client contact card (mock 350073 screen 2) */}
            {isSeller && ['in_progress', 'delivered'].includes(order.status) && (
              <div className="card-white dark:bg-violet-800 dark:border-violet-700 flex items-center justify-between p-4">
                <Link to={`/seller/${other.id}`} className="flex min-w-0 items-center gap-3">
                  <img
                    src={other.avatar || '/images/placeholder.jpg'}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-bold text-gray-900 dark:text-white">{other.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Client</p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={message}
                  aria-label={`Message ${other.name}`}
                  className="rounded-xl bg-gray-50 p-2.5 text-gray-700 transition hover:bg-gray-100 dark:bg-violet-700 dark:text-gray-200 dark:hover:bg-violet-600"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Meetup point */}
            {order.meetup && (
              <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Meetup point</h3>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-violet-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">{order.meetup.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {order.meetup.address} · {order.meetup.city}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Meet in a busy, public place. Confirm the exact spot in chat before you set off.
                      </p>
                    </div>
                  </div>
                  {order.meetup.spotId && (
                    <Link
                      to={`/safe-spots?focus=${order.meetup.spotId}`}
                      className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-amber-400 hover:underline underline-offset-2"
                    >
                      <MapPin className="w-4 h-4 shrink-0" />
                      View on map
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {(order.note || order.deliveryNote) && (
              <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5 space-y-4">
                {order.note && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {order.listingType === 'job' ? 'Cover note' : 'Buyer message'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{order.note}</p>
                  </div>
                )}
                {order.deliveryNote && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Delivery note</h3>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-line">{order.deliveryNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* Project chat preview (workspace mock a1a748) */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white">Project Chat</h3>
                {convo && (
                  <button type="button" onClick={message} className="text-xs font-semibold text-blue-600 hover:underline dark:text-amber-400">
                    Open Full Chat
                  </button>
                )}
              </div>
              {convo && convo.messages.length > 0 ? (
                <div className="mb-4 space-y-3">
                  {convo.messages.slice(-2).map((m) => {
                    const mine = m.senderId === user.id;
                    return (
                      <div key={m.id} className={`flex gap-3 ${mine ? 'flex-row-reverse' : ''}`}>
                        {mine ? (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-violet-600 dark:bg-violet-700 dark:text-amber-400">
                            Me
                          </div>
                        ) : (
                          <img
                            src={other.avatar || '/images/placeholder.jpg'}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full object-cover"
                          />
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                            mine
                              ? 'rounded-tr-none bg-purple-600 text-white dark:bg-violet-600'
                              : 'rounded-tl-none bg-gray-100 text-gray-700 dark:bg-violet-700 dark:text-gray-200'
                          }`}
                        >
                          <p className="whitespace-pre-line break-words">{m.content}</p>
                          <span className={`mt-1 block text-[10px] ${mine ? 'text-right text-purple-200' : 'text-gray-400 dark:text-gray-500'}`}>
                            {mine ? 'Me · ' : `${other.name.split(' ')[0]} · `}
                            {formatTime(m.createdAt)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                  No messages yet. Confirm details before the work starts.
                </p>
              )}
              <form onSubmit={quickSend} className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 dark:bg-violet-700">
                <input
                  value={quickMsg}
                  onChange={(e) => setQuickMsg(e.target.value)}
                  placeholder="Type a message..."
                  aria-label="Quick message"
                  className="flex-grow bg-transparent text-sm text-gray-800 placeholder-gray-500 outline-none dark:text-gray-100"
                />
                <button
                  type="submit"
                  aria-label="Send message"
                  className="rounded-full bg-purple-600 p-2 text-white transition hover:bg-purple-700 dark:bg-amber-400 dark:text-violet-950 dark:hover:bg-amber-300"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* Timeline */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Timeline</h3>
              <ol className="space-y-4">
                {order.timeline.map((e, i) => {
                  const last = i === order.timeline.length - 1;
                  return (
                    <li key={i} className="flex gap-3">
                      {last ? (
                        <CheckCircle className="w-5 h-5 text-violet-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 dark:text-violet-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{orderStatusLabel(e.status)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{e.note || stepText[e.status]}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(e.at)} · {formatTime(e.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Review */}
            {isBuyer && order.status === 'completed' && (
              <div id="order-review" className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {order.reviewed ? 'Thanks for your review' : 'Rate this order'}
                </h3>
                {order.reviewed ? (
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Your review is live on the listing.</p>
                ) : (
                  <div className="space-y-4">
                    {/* Centered counterparty header, per the Rate & Review mock */}
                    <div className="flex flex-col items-center text-center">
                      <img
                        src={other.avatar || '/images/placeholder.jpg'}
                        alt=""
                        className="w-16 h-16 rounded-full object-cover border-4 border-white dark:border-violet-700 shadow-md"
                      />
                      <p className="font-bold text-gray-900 dark:text-white mt-2">{other.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">How was your experience?</p>
                    </div>
                    <div className="flex justify-center">
                      <StarInput value={rating} onChange={setRating} />
                    </div>
                    <ReviewTags selected={reviewTags.tags} onToggle={reviewTags.toggle} />
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder={`Share details of your experience with ${other.name}. This helps others know what to expect.`}
                      className="dark:bg-violet-700 dark:border-violet-600"
                    />
                    <Button onClick={submitReview} className="w-full bg-violet-600 hover:bg-violet-700">
                      Submit review
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Order amount</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(order.price)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>Platform fee ({feeRate}%)</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(order.fee)}</span>
                </div>
                {isSeller && (
                  <div className="flex justify-between pt-2 border-t dark:border-violet-700">
                    <span className="font-semibold text-gray-900 dark:text-white">You earn</span>
                    <span className="font-bold text-violet-600 dark:text-amber-400">{formatPrice(net)}</span>
                  </div>
                )}
              </div>
              {isSeller && order.status === 'completed' && (
                <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-500">
                  Released as a {formatPrice(order.price)} earning minus the {feeRate}% platform fee.
                </p>
              )}
              {escrowHeld && (
                <div className="mt-4 flex items-start gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                  Payment is held safely in escrow.
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Actions</h3>

              {isSeller && order.status === 'pending' && (
                <>
                  <Button onClick={() => { acceptOrder(order.id); toast.success('Order accepted'); }} className="w-full bg-violet-600 hover:bg-violet-700">
                    Accept order
                  </Button>
                  <Button variant="outline" onClick={() => setConfirm('decline')} className="w-full dark:border-violet-600 dark:text-white">
                    Decline
                  </Button>
                </>
              )}
              {isSeller && order.status === 'in_progress' && (
                <>
                  <Button onClick={() => setDeliverOpen(true)} className="w-full bg-violet-600 hover:bg-violet-700">
                    Deliver work
                  </Button>
                  <Button variant="outline" onClick={() => setConfirm('cancel')} className="w-full dark:border-violet-600 dark:text-white">
                    Cancel and refund buyer
                  </Button>
                </>
              )}
              {isBuyer && order.status === 'pending' && (
                <Button variant="outline" onClick={() => setConfirm('cancel')} className="w-full dark:border-violet-600 dark:text-white">
                  Cancel order
                </Button>
              )}
              {isBuyer && order.status === 'delivered' && (
                <div className="space-y-2">
                  <SlideToConfirm label="Confirm and release payment" onConfirm={releasePayment} />
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                    Slide to release {formatPrice(order.price)} from escrow. This cannot be undone.
                  </p>
                </div>
              )}
              {isBuyer && (order.status === 'in_progress' || order.status === 'delivered') && (
                <Button variant="outline" onClick={() => setDisputeOpen(true)} className="w-full dark:border-violet-600 dark:text-white">
                  Open a dispute
                </Button>
              )}
              {isBuyer && order.status === 'disputed' && (
                <Button
                  variant="outline"
                  onClick={() => { withdrawDispute(order.id); toast.success('Dispute withdrawn'); }}
                  className="w-full dark:border-violet-600 dark:text-white"
                >
                  Withdraw dispute
                </Button>
              )}
              {isBuyer && order.demoSeller && (order.status === 'pending' || order.status === 'in_progress') && (
                <Button
                  variant="outline"
                  onClick={() => { simulateSeller(order.id); toast.success('Demo seller responded'); }}
                  className="w-full border-dashed dark:border-violet-500 dark:text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Demo: simulate seller {order.status === 'pending' ? 'accepting' : 'delivering'}
                </Button>
              )}
              {isBuyer && order.status === 'completed' && order.listingType === 'digital' && (
                <>
                  <Button onClick={downloadProduct} className="w-full bg-violet-600 hover:bg-violet-700">
                    <Download className="w-4 h-4 mr-2" />
                    Download product
                  </Button>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center">
                    Token-secured download{order.downloadToken ? ` · ${order.downloadToken}` : ''}
                    {order.downloads ? ` · ${order.downloads} download${order.downloads === 1 ? '' : 's'}` : ''}
                  </p>
                </>
              )}
              {order.status === 'completed' && (
                <Button variant="outline" onClick={receipt} className="w-full dark:border-violet-600 dark:text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Download receipt
                </Button>
              )}

              <Button variant="outline" onClick={message} className="w-full dark:border-violet-600 dark:text-white">
                <MessageSquare className="w-4 h-4 mr-2" />
                Message {isBuyer ? 'seller' : 'buyer'}
              </Button>

              {order.status === 'disputed' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Our team is reviewing this dispute. You can still message the {isBuyer ? 'seller' : 'buyer'} to resolve it.
                </p>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Deliver */}
      <Dialog open={deliverOpen} onOpenChange={setDeliverOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Deliver your work</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Tell the buyer what you are handing over. Share any files in Messages.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="dark:text-gray-200">Delivery note</Label>
            <Textarea
              value={deliverNote}
              onChange={(e) => setDeliverNote(e.target.value)}
              rows={4}
              maxLength={1000}
              className="mt-1 dark:bg-violet-700 dark:border-violet-600"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeliverOpen(false)} className="dark:border-violet-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={submitDelivery} className="bg-violet-600 hover:bg-violet-700">
              Send delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispute */}
      <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Open a dispute</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Your payment stays in escrow while we review what happened.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="dark:text-gray-200">What went wrong?</Label>
            <Textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={4}
              maxLength={1000}
              className="mt-1 dark:bg-violet-700 dark:border-violet-600"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDisputeOpen(false)} className="dark:border-violet-600 dark:text-white">
              Cancel
            </Button>
            <Button onClick={submitDispute} className="bg-violet-600 hover:bg-violet-700">
              Open dispute
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmations */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">
              {confirm === 'complete' ? 'Release payment?' : confirm === 'decline' ? 'Decline this order?' : 'Cancel this order?'}
            </AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              {confirm === 'complete'
                ? `${formatPrice(net)} will be released to ${order.sellerName}. This cannot be undone.`
                : `${formatPrice(order.price)} will be refunded to the buyer's wallet.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-violet-600 dark:text-white">Go back</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirm} className="bg-violet-600 hover:bg-violet-700 text-white">
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
