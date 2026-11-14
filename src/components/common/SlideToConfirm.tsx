import { useCallback, useRef, useState } from 'react';
import { ChevronRight, Check, ShieldCheck } from 'lucide-react';

/**
 * "Slide to confirm" — a physical, unlock-style confirmation for
 * high-value financial actions (escrow release). The label text is supplied
 * by the caller, so copy stays identical to the button it replaces; the drag
 * gesture is what changes. Deliberately forgiving: past ~85% it snaps and
 * fires once. Keyboard users can confirm with Enter/Space directly (the drag
 * is a pointer-only affordance; the action stays accessible).
 */
export function SlideToConfirm({
  label,
  onConfirm,
  disabled = false,
  className = '',
}: {
  label: string;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const firedRef = useRef(false);
  const startXRef = useRef(0);

  const THRESHOLD = 0.85;

  const fire = useCallback(() => {
    if (firedRef.current || disabled) return;
    firedRef.current = true;
    setDone(true);
    setProgress(1);
    // let the fill animation land before the parent mutates the DOM
    setTimeout(() => onConfirm(), 350);
  }, [disabled, onConfirm]);

  const move = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track || done) return;
    const rect = track.getBoundingClientRect();
    const knob = 44;
    const max = rect.width - knob - 8; // 4px inset each side
    const x = Math.min(Math.max(clientX - rect.left - 4 - knob / 2, 0), max);
    const p = max > 0 ? x / max : 0;
    if (p >= THRESHOLD) {
      setProgress(1);
      fire();
    } else {
      setProgress(p);
    }
  }, [done, fire]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || done) return;
    e.preventDefault();
    // capture the pointer so moves outside the track still drag; synthetic
    // events (tests) have no active pointer and this throws — never let it
    // break the gesture
    try {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // ignore
    }
    startXRef.current = e.clientX;
    setDragging(true);
    move(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || done) return;
    move(e.clientX);
  };

  const endDrag = () => {
    setDragging(false);
    if (!done) setProgress(0); // snap back
  };

  const fill = `${Math.round(progress * 100)}%`;

  return (
    <div
      ref={trackRef}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={`${label}. Slide or press Enter to confirm`}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault();
          fire();
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`relative h-12 w-full select-none overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 ${
        done
          ? 'bg-green-600'
          : 'bg-amber-500 hover:bg-amber-600'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}
    >
      {/* Fill that follows the knob */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 left-0 rounded-full bg-green-600/90 transition-[width] duration-150"
        style={{ width: done ? '100%' : fill }}
      />
      {/* Centered label */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 flex items-center justify-center gap-2 text-sm font-semibold transition-opacity ${
          done ? 'text-white' : progress > 0.12 ? 'text-white/50' : 'text-white'
        }`}
      >
        {done ? (
          <>
            <Check className="w-4 h-4" />
            Payment released
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4" />
            {label}
          </>
        )}
      </span>
      {/* Knob */}
      <div
        aria-hidden="true"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        style={{ left: done ? 'calc(100% - 48px)' : `calc(${fill} + 4px)` }}
        className={`absolute top-1 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md ${
          dragging ? 'cursor-grabbing scale-105' : 'cursor-grab'
        } ${done ? 'bg-green-100' : ''}`}
      >
        {done ? (
          <Check className="w-5 h-5 text-green-600" strokeWidth={3} />
        ) : (
          <span className="flex items-center -space-x-1.5 text-gray-500">
            <ChevronRight className="w-4 h-4" strokeWidth={3} />
            <ChevronRight className="w-4 h-4" strokeWidth={3} />
          </span>
        )}
      </div>
    </div>
  );
}
