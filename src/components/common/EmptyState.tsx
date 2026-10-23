import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center">
        <Icon className="w-8 h-8 text-violet-600 dark:text-violet-200" />
      </div>
      <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">{description}</p>}
      {action}
    </div>
  );
}
