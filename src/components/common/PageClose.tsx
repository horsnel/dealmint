import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  /** Route used when the page was opened directly (no browser history). */
  fallback?: string;
}

/**
 * Circular X button pinned to the top-right screen edge, just below the
 * fixed navbar. Replaces the old inline "Back / Go back" buttons: it behaves
 * exactly like the browser back button, with a sensible fallback route when
 * the page was opened directly (no history to go back to).
 */
export function PageClose({ fallback = '/' }: Props) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback);
  };
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Close and go back"
      className="fixed right-3 top-[4.5rem] lg:right-6 lg:top-[5.5rem] z-30 w-10 h-10 rounded-full bg-white/95 dark:bg-violet-800/95 border border-gray-200 dark:border-violet-600 shadow-md text-gray-600 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:shadow-lg active:scale-95 flex items-center justify-center transition-all"
    >
      <X className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
}
