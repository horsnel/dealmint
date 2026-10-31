import { ShieldCheck, BadgeCheck, Award, Star, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// Trust badge system (adapted from Postall's verification-badges, tuned to
// Dealmint's violet design language).

export type DealmintBadgeType = 'verified' | 'id_checked' | 'top_performer' | 'featured' | 'quick_responder';

const configs: Record<
  DealmintBadgeType,
  { icon: typeof ShieldCheck; label: string; colors: string }
> = {
  verified: {
    icon: ShieldCheck,
    label: 'Verified',
    colors: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  },
  id_checked: {
    icon: BadgeCheck,
    label: 'ID checked',
    colors: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  },
  top_performer: {
    icon: Award,
    label: 'Top performer',
    colors: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  },
  featured: {
    icon: Star,
    label: 'Featured',
    colors: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/40 dark:text-amber-300 dark:border-violet-700',
  },
  quick_responder: {
    icon: Zap,
    label: 'Quick responder',
    colors: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
  },
};

export function VerificationBadge({
  type,
  showLabel = false,
  className,
}: {
  type: DealmintBadgeType;
  showLabel?: boolean;
  className?: string;
}) {
  const config = configs[type];
  const Icon = config.icon;
  return (
    <span
      title={config.label}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium',
        showLabel ? 'px-2 py-0.5 text-[10px]' : 'p-1',
        config.colors,
        className
      )}
    >
      <Icon className={showLabel ? 'w-3 h-3 shrink-0' : 'w-3.5 h-3.5 shrink-0'} aria-hidden="true" />
      {showLabel && <span className="whitespace-nowrap">{config.label}</span>}
      {!showLabel && <span className="sr-only">{config.label}</span>}
    </span>
  );
}

// Composite row derived from real account data + live responsiveness metrics.
export function UserBadgeRow({
  isVerified,
  idVerified,
  rating,
  reviewCount,
  responsivenessLabel,
  className,
}: {
  isVerified?: boolean;
  idVerified?: boolean;
  rating?: number;
  reviewCount?: number;
  responsivenessLabel?: string | null;
  className?: string;
}) {
  const badges: DealmintBadgeType[] = [];
  if (isVerified) badges.push('verified');
  if (idVerified) badges.push('id_checked');
  if ((rating ?? 0) >= 4.5 && (reviewCount ?? 0) >= 5) badges.push('top_performer');
  if (responsivenessLabel && responsivenessLabel.toLowerCase().includes('under an hour')) {
    badges.push('quick_responder');
  }
  if (badges.length === 0) return null;
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {badges.map((type) => (
        <VerificationBadge key={type} type={type} />
      ))}
    </span>
  );
}
