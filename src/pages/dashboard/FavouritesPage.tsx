import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { ListingCard } from '@/components/common/ListingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { usePageTitle } from '@/hooks/usePageTitle';

export function FavouritesPage() {
  usePageTitle('Favourites');
  const { favourites, getListing } = useApp();
  const saved = favourites
    .map((id) => getListing(id))
    .filter((l): l is NonNullable<typeof l> => !!l && l.isActive && !l.isDraft);

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white">Favourites</h1>
          <p className="text-gray-600 dark:text-gray-300">Listings you saved for later</p>
        </div>

        {saved.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {saved.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        ) : (
          <div className="card-white dark:bg-violet-800 dark:border-violet-700">
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              description="Tap the heart on any listing to keep it here."
              action={
                <Link to="/browse">
                  <Button className="bg-violet-600 hover:bg-violet-700">Browse listings</Button>
                </Link>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
