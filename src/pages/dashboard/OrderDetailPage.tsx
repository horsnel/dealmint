import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Circle,
  Download,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { OrderStatusBadge, orderStatusLabel } from '@/components/common/OrderStatusBadge';
import { StarInput } from '@/components/common/Stars';
import { formatDate, formatPrice, formatTime } from '@/lib/format';
import { typeLabel } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Order } from '@/types';

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
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate('/dashboard/orders');
  };
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
    addReview,
    startConversation,
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

  if (!order || !user) {
    return (
      <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      </div>
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

  const message = () => {
    const cid = startConversation(other, listing);
    if (cid) navigate(`/dashboard/messages?c=${cid}`);
  };

  const submitDelivery = () => {
    if (deliverNote.trim().length < 10) return toast.error('Add a short note (at least 10 characters) about what you are delivering');
    deliverOrder(order.id, deliverNote.trim());
    setDeliverOpen(false);
    setDeliverNote('');
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
    if (comment.trim().length < 10) return toast.error('Please write at least 10 characters');
    const res = addReview(order.id, rating, comment);
    if (!res.ok) return toast.error(res.error);
    toast.success('Thanks for your review!');
    setComment('');
  };

  const runConfirm = () => {
    if (confirm === 'cancel') {
      cancelOrder(order.id);
      toast.success('Order cancelled and the payment was refunded');
    } else if (confirm === 'decline') {
      declineOrder(order.id);
      toast.success('Order declined. The buyer was refunded.');
    } else if (confirm === 'complete') {
      completeOrder(order.id);
      toast.success('Payment released to the seller');
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
    downloadText(
      `${(listing?.fileName || order.listingTitle).replace(/[^a-z0-9._-]+/gi, '_')}-license.txt`,
      [
        `Licence for: ${order.listingTitle}`,
        `Licensed to: ${order.buyerName}`,
        `Order: ${order.id}`,
        '',
        'Prototype note: the original product file is not stored in this demo build.',
        'In production this button downloads the file uploaded by the seller.',
      ].join('\n')
    );
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
            Order details
          </h1>
          <OrderStatusBadge status={order.status} />
        </div>

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
                  <Link to={`/listing/${listing.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-amber-400 line-clamp-2">
                    {order.listingTitle}
                  </Link>
                ) : (
                  <p className="font-semibold text-gray-900 dark:text-white line-clamp-2">{order.listingTitle}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isBuyer ? 'Seller' : 'Buyer'}:{' '}
                  <Link to={`/seller/${other.id}`} className="hover:underline">
                    {other.name}
                  </Link>
                </p>
              </div>
            </div>

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
              <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {order.reviewed ? 'Thanks for your review' : 'Rate this order'}
                </h3>
                {order.reviewed ? (
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Your review is live on the listing.</p>
                ) : (
                  <div className="space-y-3">
                    <StarInput value={rating} onChange={setRating} />
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="How was your experience?"
                      className="dark:bg-violet-700 dark:border-violet-600"
                    />
                    <Button onClick={submitReview} className="bg-violet-600 hover:bg-violet-700">
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
                  <span>Platform fee</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(order.fee)}</span>
                </div>
                {isSeller && (
                  <div className="flex justify-between pt-2 border-t dark:border-violet-700">
                    <span className="font-semibold text-gray-900 dark:text-white">You earn</span>
                    <span className="font-bold text-violet-600 dark:text-amber-400">{formatPrice(net)}</span>
                  </div>
                )}
              </div>
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
                <Button onClick={() => setConfirm('complete')} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                  Confirm and release payment
                </Button>
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
                <Button onClick={downloadProduct} className="w-full bg-violet-600 hover:bg-violet-700">
                  <Download className="w-4 h-4 mr-2" />
                  Download product
                </Button>
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

              <Button
                variant="outline"
                onClick={goBack}
                className="w-full dark:border-violet-600 dark:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go back
              </Button>
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
    </div>
  );
}
