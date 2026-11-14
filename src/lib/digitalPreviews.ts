import type { Listing } from '@/types';
import { digitalCover } from '@/lib/digitalCovers';

/**
 * Stories-style preview slides for digital products ("Instant previews" from
 * the design blueprint — like Instagram Stories, swipe through the inside of
 * the product before buying).
 *
 * Same render-time mapping pattern as digitalCovers.ts: the four seed
 * products map to dedicated AI-generated "inside look" slides; any other
 * digital product gets a synthesized preview from its own cover, description
 * and price, so every digital listing has a preview with zero data migration.
 */
export interface PreviewSlide {
  src: string;
  caption?: string;
}

/** Generated inside-look slides for the seed storefront. */
const SLIDES: Record<string, PreviewSlide[]> = {
  'Notion Budget & Planner Template': [
    { src: '/images/digital_preview_notion_1.jpg', caption: 'Budget dashboard: every naira at a glance' },
    { src: '/images/digital_preview_notion_2.jpg', caption: 'Categorized expense log with tags' },
    { src: '/images/digital_preview_notion_3.jpg', caption: 'Weekly planner with to-do blocks' },
  ],
  'Afrobeat Drum Loop Pack': [
    { src: '/images/digital_preview_loops_1.jpg', caption: 'Percussion loops, waveform preview' },
    { src: '/images/digital_preview_loops_2.jpg', caption: '48 one-shot drum patterns' },
    { src: '/images/digital_preview_loops_3.jpg', caption: 'Drop-in ready for any DAW' },
  ],
  'Learn Excel for Business (E-book)': [
    { src: '/images/digital_preview_excel_1.jpg', caption: 'From zero to business-ready spreadsheets' },
    { src: '/images/digital_preview_excel_2.jpg', caption: 'Charts and formulas, step by step' },
    { src: '/images/digital_preview_excel_3.jpg', caption: 'Formula cheat-sheet included' },
  ],
  'Social Media Template Bundle': [
    { src: '/images/digital_preview_canva_1.jpg', caption: '50 editable post templates' },
    { src: '/images/digital_preview_canva_2.jpg', caption: 'Stories that match your brand' },
    { src: '/images/digital_preview_canva_3.jpg', caption: 'Carousel sets with captions' },
  ],
};

/** Synthesized preview for non-seed digital products (cover + description). */
function synthesized(listing: Listing): PreviewSlide[] {
  const slides: PreviewSlide[] = [
    { src: digitalCover(listing), caption: listing.title },
  ];
  if (listing.description) {
    slides.push({ src: '', caption: listing.description.slice(0, 220) });
  }
  return slides;
}

export function digitalPreviews(listing: Listing): PreviewSlide[] {
  const known = SLIDES[listing.title];
  if (known) return known;
  return synthesized(listing);
}
