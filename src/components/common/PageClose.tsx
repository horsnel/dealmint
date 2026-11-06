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
 * Placement: the negative top margin cancels most of the parent page's
 * pt-8 container padding, so the button sits right against the demarcation
 * line between the fixed header and the page body instead of floating in
 * the middle of the room. It scrolls with the page on purpose — no fixed
 * positioning, so it never floats over content further down.
 *
 * Styling: transparent fill, no shadow, and a border tinted close to the
 * lavender page background so the circle blends into the body rather than
 * reading as a white sticker on top of it.
 */
export function PageClose({ fallback = '/' }: Props) {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback);
  };
  return (
    <div className="flex justify-end -mt-5 mb-4" aria-hidden="false">
      <button
        type="button"
        onClick={goBack}
        aria-label="Close and go back"
        className="w-10 h-10 rounded-full bg-transparent dark:bg-transparent border border-violet-200/80 dark:border-violet-700/70 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-violet-300 dark:hover:border-violet-600 hover:bg-white/50 dark:hover:bg-violet-800/60 active:scale-95 flex items-center justify-center transition-colors"
      >
        <X className="w-5 h-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
