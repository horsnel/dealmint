import { Link } from 'react-router-dom';

interface LogoProps {
  href?: string;
  size?: 'md' | 'lg';
  /**
   * 'auto' — wordmark follows the theme (dark text on light, white on dark).
   * 'light' — forces a white wordmark, used when the navbar is transparent
   * over the violet landing hero.
   */
  tone?: 'auto' | 'light';
}

/**
 * Dealmint brand logo — badge-free standalone mark.
 * Abstract infinity/eye: violet + amber overlapping circles with a white
 * centre dot, next to the Dealmint wordmark. A soft white glow keeps the
 * mark separable from dark or violet backgrounds (invisible on white).
 */
export function Logo({ href = '/', size = 'md', tone = 'auto' }: LogoProps) {
  const isLg = size === 'lg';
  const circle = isLg ? 26 : 20;
  const dot = isLg ? 12 : 9;

  return (
    <Link
      to={href}
      aria-label="Dealmint home"
      className={`inline-flex items-center transition-opacity duration-200 hover:opacity-80 ${
        isLg ? 'gap-2.5' : 'gap-2'
      }`}
    >
      <span
        className="relative block shrink-0"
        style={{
          width: Math.round(circle * 1.75),
          height: circle,
          filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.55))',
        }}
        aria-hidden="true"
      >
        <span
          className="absolute rounded-full bg-violet-600"
          style={{ width: circle, height: circle, left: 0, top: 0 }}
        />
        <span
          className="absolute rounded-full bg-amber-500"
          style={{ width: circle, height: circle, right: 0, top: 0 }}
        />
        <span
          className="absolute rounded-full bg-white z-10"
          style={{
            width: dot,
            height: dot,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </span>
      <span
        className={`font-display font-bold leading-none tracking-tight ${
          tone === 'light' ? 'text-white' : 'text-gray-900 dark:text-white'
        } ${isLg ? 'text-2xl' : 'text-lg'}`}
      >
        Dealmint
      </span>
    </Link>
  );
}
