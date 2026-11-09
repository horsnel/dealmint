import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download, Eye } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { digitalPreviews, type PreviewSlide } from '@/lib/digitalPreviews';
import type { Listing } from '@/types';

/**
 * Full-screen, swipeable digital product preview — Instagram-Stories style.
 *
 * Rendered through a portal to <body>: the route-in wrapper historically
 * retained a transform that hijacked inline position:fixed (the share-sheet
 * bug), so every custom overlay goes straight on the body instead.
 *
 * Gestures: tap left/right thirds or arrow keys to move, swipe down or Esc to
 * close, swipe horizontally to navigate. Segmented progress bars up top.
 */
export function DigitalPreviewOverlay({
  listing,
  open,
  onClose,
}: {
  listing: Listing;
  open: boolean;
  onClose: () => void;
}) {
  const slides: PreviewSlide[] = digitalPreviews(listing);
  const [index, setIndex] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Body scroll lock + Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, slides.length - 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, slides.length]);

  const go = useCallback(
    (d: number) => setIndex((i) => Math.min(Math.max(i + d, 0), slides.length - 1)),
    [slides.length]
  );

  if (!open) return null;

  const slide = slides[Math.min(index, slides.length - 1)];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Preview of ${listing.title}`}
      className="fixed inset-0 z-[70] flex flex-col bg-black/90 backdrop-blur-sm fade-in"
      onTouchStart={(e) => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const start = touchStart.current;
        touchStart.current = null;
        if (!start) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)) return onClose(); // swipe down
        if (dx < -50) go(1);
        else if (dx > 50) go(-1);
      }}
    >
      {/* Progress segments */}
      <div className="absolute top-0 left-0 right-0 z-10 flex gap-1 p-3">
        {slides.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <div
              className={`h-full rounded-full bg-white transition-[width] duration-300 ${i < index ? 'w-full' : i === index ? 'w-1/2' : 'w-0'}`}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-2">
        <img
          src={listing.seller.avatar || '/images/avatar_default.jpg'}
          alt={listing.seller.name}
          className="w-9 h-9 rounded-full object-cover border-2 border-amber-500"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{listing.seller.name}</p>
          <p className="text-xs text-white/60 truncate">{listing.category}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md border border-white/20 transition-colors hover:bg-white/25 active:bg-white/25"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Slide area */}
      <div className="relative flex-1 min-h-0">
        {slide.src ? (
          <img
            src={slide.src}
            alt={slide.caption || listing.title}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <p className="max-w-md text-center text-lg text-white/90 leading-relaxed">
              {slide.caption}
            </p>
          </div>
        )}

        {/* Tap zones */}
        {index > 0 && (
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(-1)}
            className="absolute left-0 top-0 bottom-24 w-1/3 flex items-center justify-start pl-3 text-white/70 hover:text-white"
          >
            <ChevronLeft className="w-9 h-9 drop-shadow" />
          </button>
        )}
        {index < slides.length - 1 && (
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(1)}
            className="absolute right-0 top-0 bottom-24 w-1/3 flex items-center justify-end pr-3 text-white/70 hover:text-white"
          >
            <ChevronRight className="w-9 h-9 drop-shadow" />
          </button>
        )}

        {/* Caption chip */}
        {slide.caption && slide.src && (
          <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none">
            <span className="rounded-full bg-white/15 px-4 py-1.5 text-sm text-white backdrop-blur-md border border-white/20 max-w-full truncate">
              {slide.caption}
            </span>
          </div>
        )}
      </div>

      {/* Bottom bar — price + buy */}
      <div className="flex items-center gap-3 border-t border-white/10 bg-black/60 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/60 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            Preview · slide {index + 1} of {slides.length}
          </p>
          <p className="text-xl font-bold text-white leading-tight">{formatPrice(listing.price)}</p>
        </div>
        <a
          href={`/listing/${listing.id}`}
          onClick={(e) => {
            e.preventDefault();
            onClose();
            window.location.assign(`/listing/${listing.id}`);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 hover:bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Buy &amp; download
        </a>
      </div>
    </div>,
    document.body
  );
}
