import { useState } from 'react';

const PRESETS = [
  'Clear instructions',
  'Fast payment',
  'Good communication',
  'Great quality',
  'On time',
  'Polite',
];

/**
 * "What went well?" quick tags from the review mock. Selection is held here
 * and handed back via onChange; callers fold the chosen tags into the review
 * comment they submit, so they are stored as plain review text.
 */
export function useReviewTags() {
  const [tags, setTags] = useState<string[]>([]);
  const toggle = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  const reset = () => setTags([]);
  /** Fold the tags into the submitted comment text. */
  const fold = (comment: string) => (tags.length ? `${tags.join(', ')}. ${comment}` : comment);
  return { tags, toggle, reset, fold };
}

export function ReviewTags({
  selected,
  onToggle,
}: {
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">What went well?</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((tag) => {
          const active = selected.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/40'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 dark:bg-violet-800 dark:text-gray-300 dark:border-violet-600 dark:hover:border-purple-500/50'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
