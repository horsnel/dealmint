import { ShieldCheck } from 'lucide-react';

/**
 * "Safe Spot passport stamp" — a compact composite trust mark that collapses
 * email, phone and ID verification into one stamp-shaped badge instead of a
 * scatter of separate chips. Level:
 *   3 = email + phone + ID  (green ring — fully stamped)
 *   2 = any two             (violet ring)
 *   1 = one                 (amber ring)
 *   0 = nothing verified yet (grey ring)
 * The breakdown lives in the title tooltip so no text is added to the page.
 */
export function TrustPassport({
  emailVerified,
  phoneVerified,
  idVerified,
  size = 'md',
  className = '',
}: {
  emailVerified?: boolean;
  phoneVerified?: boolean;
  idVerified?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const ticks = [emailVerified, phoneVerified, idVerified].filter(Boolean).length;
  const level = Math.max(0, Math.min(3, ticks));

  const ring =
    level === 3
      ? 'border-green-500 text-green-600 dark:text-green-400'
      : level === 2
        ? 'border-violet-500 text-violet-600 dark:text-amber-400'
        : level === 1
          ? 'border-amber-500 text-amber-600 dark:text-amber-400'
          : 'border-gray-300 text-gray-400 dark:border-violet-600 dark:text-violet-400';

  const dims = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  const parts = [
    `Email ${emailVerified ? '✓' : '—'}`,
    `Phone ${phoneVerified ? '✓' : '—'}`,
    `ID ${idVerified ? 'checked ✓' : '—'}`,
  ].join(' · ');

  return (
    <span
      role="img"
      aria-label={`Trust passport: ${parts}`}
      title={`Trust passport: ${parts}`}
      className={`inline-flex ${dims} shrink-0 items-center justify-center rounded-full border-2 border-dashed bg-white/70 dark:bg-violet-900/60 ${ring} ${className}`}
    >
      <span
        className={`inline-flex ${dims === 'w-6 h-6' ? 'w-4 h-4' : 'w-[22px] h-[22px]'} items-center justify-center rounded-full ${
          level === 3
            ? 'bg-green-500 text-white'
            : level === 2
              ? 'bg-violet-600 text-white'
              : level === 1
                ? 'bg-amber-500 text-white'
                : 'bg-gray-200 text-gray-400 dark:bg-violet-700 dark:text-violet-300'
        }`}
      >
        <ShieldCheck className={iconSize} strokeWidth={2.5} />
      </span>
    </span>
  );
}
