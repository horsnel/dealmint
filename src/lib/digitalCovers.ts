import type { Listing } from '@/types';

/**
 * Curated cover art for the seed digital storefront.
 *
 * Every seed digital listing shipped with the shared category_digital.jpg
 * placeholder, which made the storefront look like a wireframe (the exact same
 * purple 3D workstation image on every card). Cloud listing docs carry that
 * placeholder path in their images array, so the fix lives at render time:
 * known seed titles map to dedicated cover art, everything else (real posts
 * from real sellers) keeps its own uploaded image untouched.
 */
const COVERS: Record<string, string> = {
  'Notion Budget & Planner Template': '/images/digital_notion_planner.jpg',
  'Afrobeat Drum Loop Pack': '/images/digital_afrobeat_loops.jpg',
  'Learn Excel for Business (E-book)': '/images/digital_excel_ebook.jpg',
  'Social Media Template Bundle': '/images/digital_canva_bundle.jpg',
};

export function digitalCover(listing: Pick<Listing, 'title' | 'images'>): string {
  return COVERS[listing.title] || listing.images[0] || '/images/placeholder.jpg';
}
