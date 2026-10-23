import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { OrderStatusBadge } from '@/components/common/OrderStatusBadge';
import { formatDate, formatPrice } from '@/lib/format';
import { typeLabel } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Order } from '@/types';

export function OrdersPage() {
  usePageTitle('Orders');
  const { user, orders } = useApp();
  const [status, setStatus] = useState('all');

  const buying = orders.filter((o) => o.buyerId === user?.id);
  const selling = orders.filter((o) => o.sellerId === user?.id);

  const applyFilter = (list: Order[]) => {
    if (status === 'all') return list;
    if (status === 'active') return list.filter((o) => ['pending', 'in_progress', 'delivered'].includes(o.status));
    return list.filter((o) => o.status === status);
  };

  const needsAction = (o: Order) => {
    if (o.sellerId === user?.id && (o.status === 'pending' || o.status === 'in_progress')) return true;
    if (o.buyerId === user?.id && o.status === 'delivered') return true;
    return false;
  };

  const renderList = (list: Order[], role: 'buyer' | 'seller') => {
    const filtered = applyFilter(list);
    if (filtered.length === 0) {
      return (
        <div className="card-white dark:bg-violet-800 dark:border-violet-700">
          <EmptyState
            icon={Package}
            title={list.length === 0 ? (role === 'buyer' ? 'No purchases yet' : 'No sales yet') : 'No orders match this filter'}
            description={
              list.length === 0
                ? role === 'buyer'
                  ? 'Orders you place will appear here.'
                  : 'Orders from buyers will appear here.'
                : undefined
            }
            action={
              list.length === 0 && role === 'buyer' ? (
                <Link to="/browse">
                  <Button className="bg-violet-600 hover:bg-violet-700">Browse listings</Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {filtered.map((o) => (
          <Link
            key={o.id}
            to={`/dashboard/orders/${o.id}`}
            className="card-white dark:bg-violet-800 dark:border-violet-700 p-4 lg:p-5 flex items-center gap-4 hover:shadow-lg transition-shadow"
          >
            <img
              src={o.listingImage || '/images/placeholder.jpg'}
              alt=""
              className="w-16 h-16 lg:w-20 lg:h-20 rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <OrderStatusBadge status={o.status} />
                <span className="text-xs text-gray-500 dark:text-gray-400">{typeLabel(o.listingType)}</span>
                {needsAction(o) && (
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Needs your attention</span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{o.listingTitle}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {role === 'buyer' ? `Seller: ${o.sellerName}` : `Buyer: ${o.buyerName}`} · {formatDate(o.createdAt)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-violet-600 dark:text-amber-400">
                {formatPrice(role === 'seller' ? o.price - o.fee : o.price)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{role === 'seller' ? 'you earn' : 'paid'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 hidden sm:block" />
          </Link>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">Orders</h1>
            <p className="text-gray-600 dark:text-gray-300">Track what you bought and what you are selling</p>
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44 dark:bg-violet-800 dark:border-violet-700" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In progress</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue={selling.some(needsAction) && !buying.some(needsAction) ? 'selling' : 'buying'}>
          <TabsList className="mb-6 dark:bg-violet-800">
            <TabsTrigger value="buying" className="dark:data-[state=active]:bg-violet-600">
              Buying ({buying.length})
            </TabsTrigger>
            <TabsTrigger value="selling" className="dark:data-[state=active]:bg-violet-600">
              Selling ({selling.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="buying">{renderList(buying, 'buyer')}</TabsContent>
          <TabsContent value="selling">{renderList(selling, 'seller')}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
