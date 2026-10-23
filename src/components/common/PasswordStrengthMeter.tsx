import { passwordStrength } from '@/lib/validation';

const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-green-500', 'bg-green-600'];

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const s = passwordStrength(password);
  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`h-1.5 flex-1 rounded-full ${n <= s.score ? colors[s.score] : 'bg-gray-200 dark:bg-violet-700'}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {s.label}
        {s.hints.length > 0 ? ` · Needs: ${s.hints.join(', ').toLowerCase()}` : ''}
      </p>
    </div>
  );
}
