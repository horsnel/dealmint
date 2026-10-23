import { Star } from 'lucide-react';

interface StarsProps {
  value: number;
  className?: string;
}

// Read-only star row used wherever a rating is shown
export function Stars({ value, className = '' }: StarsProps) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`w-4 h-4 ${n <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-violet-600'}`}
        />
      ))}
    </div>
  );
}

interface StarInputProps {
  value: number;
  onChange: (v: number) => void;
}

export function StarInput({ value, onChange }: StarInputProps) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          onClick={() => onChange(n)}
          className="p-0.5"
        >
          <Star
            className={`w-6 h-6 transition-colors ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-violet-600 hover:text-amber-300'}`}
          />
        </button>
      ))}
    </div>
  );
}
