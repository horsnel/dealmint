import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/EmptyState';
import { usePageTitle } from '@/hooks/usePageTitle';

export function NotFoundPage() {
  usePageTitle('Page not found');
  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <EmptyState
          icon={Compass}
          title="Page not found"
          description="The page you are looking for does not exist or has moved."
          action={
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <Button className="bg-violet-600 hover:bg-violet-700">Go home</Button>
              </Link>
              <Link to="/browse">
                <Button variant="outline" className="dark:border-violet-600 dark:text-white">
                  Browse listings
                </Button>
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
