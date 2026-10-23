import { useParams, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { ListingForm } from '@/components/forms/ListingForm';
import { useApp } from '@/context/AppContext';

export function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, getListing } = useApp();
  const listing = getListing(id);

  if (!listing || listing.seller.id !== user?.id) {
    return (
      <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            icon={Search}
            title="Listing not found"
            description="You can only edit listings that belong to your account."
            action={
              <Link to="/dashboard/listings">
                <Button className="bg-violet-600 hover:bg-violet-700">Back to my listings</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return <ListingForm key={listing.id} type={listing.type} listing={listing} />;
}
