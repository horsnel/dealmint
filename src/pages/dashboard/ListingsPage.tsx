import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, Pause, Play, Trash2, Search, Briefcase, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { EmptyState } from '@/components/common/EmptyState';
import { formatPrice, priceSuffix } from '@/lib/format';
import { typeLabel } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Listing } from '@/types';

const createLinks = [
  { name: 'Gig', href: '/post/gig' },
  { name: 'Task', href: '/post/task' },
  { name: 'Job', href: '/post/job' },
  { name: 'Service', href: '/post/service' },
  { name: 'Digital product', href: '/post/digital' },
];

export function ListingsPage() {
  usePageTitle('My Listings');
  const navigate = useNavigate();
  const { myListings, updateListing, deleteListing } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [toDelete, setToDelete] = useState<Listing | null>(null);

  const term = searchQuery.trim().toLowerCase();
  const matches = (l: Listing) =>
    !term || l.title.toLowerCase().includes(term) || l.category.toLowerCase().includes(term);

  const active = myListings.filter((l) => l.isActive && !l.isDraft && matches(l));
  const paused = myListings.filter((l) => !l.isActive && !l.isDraft && matches(l));
  const drafts = myListings.filter((l) => l.isDraft && matches(l));

  const handleToggleStatus = (l: Listing) => {
    updateListing(l.id, { isActive: !l.isActive });
    toast.success(l.isActive ? 'Listing paused' : 'Listing is live again');
  };

  const handleDelete = () => {
    if (!toDelete) return;
    deleteListing(toDelete.id);
    toast.success('Listing deleted');
    setToDelete(null);
  };

  const renderList = (list: Listing[], emptyText: string) =>
    list.length > 0 ? (
      <div className="space-y-4">
        {list.map((listing) => (
          <div key={listing.id} className="card-white dark:bg-violet-800 dark:border-violet-700 p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <img
                src={listing.images[0] || '/images/placeholder.jpg'}
                alt={listing.title}
                className="w-full lg:w-32 h-32 object-cover rounded-lg"
              />

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-700 dark:text-violet-200">
                    {typeLabel(listing.type)}
                  </Badge>
                  {listing.isDraft && (
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-violet-600 dark:text-gray-100">Draft</Badge>
                  )}
                  {!listing.isDraft && !listing.isActive && (
                    <Badge className="bg-gray-100 text-gray-700 dark:bg-violet-600 dark:text-gray-100">Paused</Badge>
                  )}
                  {listing.isFeatured && (
                    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200">Featured</Badge>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">{listing.title}</h3>
                <p className="text-violet-600 dark:text-amber-400 font-bold">
                  {formatPrice(listing.price)}
                  <span className="text-gray-500 dark:text-gray-400 font-normal text-sm">
                    {priceSuffix(listing.priceType) || ' fixed'}
                  </span>
                </p>
                {!listing.isDraft && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {listing.views || 0} views · {listing.completedOrders} orders
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!listing.isDraft && (
                  <Link to={`/listing/${listing.id}`} aria-label="View listing">
                    <Button variant="outline" size="sm" className="dark:border-violet-600">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                )}
                <Link to={`/dashboard/listings/${listing.id}/edit`} aria-label="Edit listing">
                  <Button variant="outline" size="sm" className="dark:border-violet-600">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                {!listing.isDraft && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={listing.isActive ? 'Pause listing' : 'Resume listing'}
                    className="dark:border-violet-600"
                    onClick={() => handleToggleStatus(listing)}
                  >
                    {listing.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Delete listing"
                  className="text-red-500 hover:bg-red-50 dark:border-violet-600"
                  onClick={() => setToDelete(listing)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="card-white dark:bg-violet-800 dark:border-violet-700">
        <EmptyState
          icon={Briefcase}
          title={emptyText}
          description={myListings.length === 0 ? 'Create your first listing to start earning.' : undefined}
          action={
            myListings.length === 0 ? (
              <Button onClick={() => navigate('/post/gig')} className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Listing
              </Button>
            ) : undefined
          }
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">
              My Listings
            </h1>
            <p className="text-gray-600 dark:text-gray-300">Manage your gigs, tasks, and services</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-violet-600 hover:bg-violet-700">
                <Plus className="w-4 h-4 mr-2" />
                Create New Listing
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {createLinks.map((l) => (
                <DropdownMenuItem key={l.href} onClick={() => navigate(l.href)}>
                  {l.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search your listings..."
            aria-label="Search your listings"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 dark:bg-violet-800 dark:border-violet-700"
          />
        </div>

        <Tabs defaultValue="active">
          <TabsList className="mb-6 dark:bg-violet-800">
            <TabsTrigger value="active" className="dark:data-[state=active]:bg-violet-600">
              Active ({active.length})
            </TabsTrigger>
            <TabsTrigger value="paused" className="dark:data-[state=active]:bg-violet-600">
              Paused ({paused.length})
            </TabsTrigger>
            <TabsTrigger value="drafts" className="dark:data-[state=active]:bg-violet-600">
              Drafts ({drafts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">{renderList(active, 'No active listings')}</TabsContent>
          <TabsContent value="paused">{renderList(paused, 'No paused listings')}</TabsContent>
          <TabsContent value="drafts">{renderList(drafts, 'No draft listings')}</TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="dark:bg-violet-900 dark:border-violet-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              "{toDelete?.title}" will be removed for good. Existing orders are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:border-violet-600 dark:text-white">Keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
