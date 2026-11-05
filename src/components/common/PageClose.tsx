import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  /** Route used when the page was opened directly (no browser history). */
  fallback?: string;
}

/**
 * Circular X button shown inline at the top-right of the page content.
 * Replaces the old inline "Back / Go back" buttons: it behaves exactly like
 * the browser back button, with a sensible fallback route when the page was
 * opened directly (no history to go back to).
 *
 * It scrolls with the page on purpose — no fixed positioning, so it never
 * floats over content further down.
 */
export function PageClose({ fallback = '/' }: Props) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback);
  };
  return (
    <div className="flex justify-end mb-3" aria-hidden="false">
      <button
        type="button"
        onClick={goBack}
        aria-label="Close and go back"
        className="w-10 h-10 rounded-full bg-white dark:bg-violet-800 border border-gray-200 dark:border-violet-600 shadow-sm text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:shadow active:scale-95 flex items-center justify-center transition-all"
      >
        <X className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
