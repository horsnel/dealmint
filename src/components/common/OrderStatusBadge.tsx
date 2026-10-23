import type { OrderStatus } from '@/types';

const styles: Record<OrderStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  in_progress: { label: 'In progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  delivered: { label: 'Delivered', className: 'bg-violet-100 text-violet-700 dark:bg-violet-700 dark:text-violet-100' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-600 dark:bg-violet-700 dark:text-gray-300' },
  disputed: { label: 'Disputed', className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

export function orderStatusLabel(status: OrderStatus) {
  return styles[status].label;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = styles[status];
  return <span className={`text-xs font-medium px-3 py-1 rounded-full ${s.className}`}>{s.label}</span>;
}
