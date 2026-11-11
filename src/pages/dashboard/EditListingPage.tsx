import { useParams, Link } from 'react-router-dom';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
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
      <DashboardShell>
        <div>
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
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <ListingForm key={listing.id} type={listing.type} listing={listing} inDashboard />
    </DashboardShell>
  );
}
