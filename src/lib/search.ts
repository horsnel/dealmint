// Shared browse-filter logic so BrowsePage and the Saved Searches page
// always agree on what "matches this search" means.

import type { Listing, ListingType } from '@/types';

export const priceRanges: Record<string, [number, number]> = {
  under_5k: [0, 5000],
  '5k_20k': [5000, 20000],
  '20k_50k': [20000, 50000],
  over_50k: [50000, Infinity],
};

// Mirrors the Browse page filters (minus the rating filter, which saved
// searches don't store because ratings move under your feet).
export function matchesSearchFilters(
  l: Listing,
  f: { query: string; type: string; category: string; where: string; price: string },
  matchesCategory: (l: Listing, key: string) => boolean
) {
  const term = f.query.trim().toLowerCase();
  const matchesSearch =
    !term ||
    l.title.toLowerCase().includes(term) ||
    l.description.toLowerCase().includes(term) ||
    l.category.toLowerCase().includes(term) ||
    l.tags.some((t) => t.toLowerCase().includes(term));
  if (!matchesSearch) return false;
  if (!matchesCategory(l, f.category)) return false;
  if (f.type !== 'all' && l.type !== (f.type as ListingType)) return false;
  if (f.price !== 'all') {
    const [min, max] = priceRanges[f.price] || [0, Infinity];
    if (l.price < min || l.price >= max) return false;
  }
  if (f.where === 'remote' && !l.isRemote) return false;
  if (f.where !== 'all' && f.where !== 'remote' && l.location !== f.where) return false;
  return true;
}

// Short human label for a saved search, e.g. `“logo” · Gigs · Lagos`
export function savedSearchLabel(f: { query: string; type: string; category: string; where: string; price: string }) {
  const parts: string[] = [];
  if (f.query.trim()) parts.push(`“${f.query.trim()}”`);
  if (f.type !== 'all') parts.push(f.type.charAt(0).toUpperCase() + f.type.slice(1) + 's');
  if (f.where !== 'all' && f.where !== 'remote') parts.push(f.where);
  if (f.where === 'remote') parts.push('Remote');
  return parts.length ? parts.join(' · ') : 'Everything';
}
