import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { Stars } from '@/components/common/Stars';
import { formatPrice, timeAgo } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';

export function ReviewsPage() {
  usePageTitle('Reviews');
  const { user, orders, reviewsForSeller, getSellerStats, replyToReview, getListing } = useApp();
  const [replies, setReplies] = useState<Record<string, string>>({});

  if (!user) return null;
  const received = reviewsForSeller(user.id);
  const stats = getSellerStats(user.id);
  const toReview = orders.filter((o) => o.buyerId === user.id && o.status === 'completed' && !o.reviewed);

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">Reviews</h1>
          <p className="text-gray-600 dark:text-gray-300">What people say about your work, and orders waiting for your review</p>
        </div>

        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 mb-8 flex items-center gap-4">
          <Star className="w-10 h-10 text-amber-400 fill-amber-400" />
          <div>
            <p className="font-display font-bold text-2xl text-gray-900 dark:text-white">
              {stats.count > 0 ? stats.rating : 'No ratings yet'}
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {stats.count > 0 ? `Across ${stats.count} review${stats.count === 1 ? '' : 's'}` : 'Complete orders to start collecting reviews'}
            </p>
          </div>
        </div>

        <Tabs defaultValue={toReview.length > 0 ? 'write' : 'received'}>
          <TabsList className="mb-6 dark:bg-violet-800">
            <TabsTrigger value="received" className="dark:data-[state=active]:bg-violet-600">
              Received ({received.length})
            </TabsTrigger>
            <TabsTrigger value="write" className="dark:data-[state=active]:bg-violet-600">
              To review ({toReview.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received">
            {received.length === 0 ? (
              <div className="card-white dark:bg-violet-800 dark:border-violet-700">
                <EmptyState icon={Star} title="No reviews yet" description="Reviews from your buyers will appear here." />
              </div>
            ) : (
              <div className="space-y-4">
                {received.map((r) => {
                  const l = getListing(r.listingId);
                  return (
                    <div key={r.id} className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={r.reviewerAvatar || '/images/avatar_default.jpg'}
                          alt={r.reviewerName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white">{r.reviewerName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {timeAgo(r.createdAt)}
                            {l && (
                              <>
                                {' · '}
                                <Link to={`/listing/${l.id}`} className="hover:underline">
                                  {l.title}
                                </Link>
                              </>
                            )}
                          </p>
                        </div>
                        <Stars value={r.rating} />
                      </div>
                      <p className="text-gray-600 dark:text-gray-300">{r.comment}</p>
                      {r.reply ? (
                        <div className="mt-3 ml-6 pl-4 border-l-2 border-violet-300 dark:border-violet-500">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">Your response</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{r.reply}</p>
                        </div>
                      ) : (
                        <div className="mt-3 flex gap-2">
                          <Input
                            value={replies[r.id] || ''}
                            onChange={(e) => setReplies({ ...replies, [r.id]: e.target.value })}
                            placeholder="Reply publicly"
                            aria-label="Reply to review"
                            className="dark:bg-violet-700 dark:border-violet-600"
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (!replies[r.id]?.trim()) return;
                              replyToReview(r.id, replies[r.id]);
                              toast.success('Reply posted');
                            }}
                            className="dark:border-violet-600 dark:text-white"
                          >
                            Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="write">
            {toReview.length === 0 ? (
              <div className="card-white dark:bg-violet-800 dark:border-violet-700">
                <EmptyState icon={Star} title="You are all caught up" description="Completed orders you have not reviewed yet will show here." />
              </div>
            ) : (
              <div className="space-y-4">
                {toReview.map((o) => (
                  <div
                    key={o.id}
                    className="card-white dark:bg-violet-800 dark:border-violet-700 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <img src={o.listingImage || '/images/placeholder.jpg'} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">{o.listingTitle}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {o.sellerName} · {formatPrice(o.price)}
                      </p>
                    </div>
                    <Link to={`/dashboard/orders/${o.id}`}>
                      <Button className="bg-violet-600 hover:bg-violet-700">Write a review</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
