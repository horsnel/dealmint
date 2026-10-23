import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-10 w-64 dark:bg-violet-800" />
        <Skeleton className="h-6 w-96 max-w-full dark:bg-violet-800" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl dark:bg-violet-800" />
          ))}
        </div>
      </div>
    </div>
  );
}
