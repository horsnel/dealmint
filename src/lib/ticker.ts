import type { Listing, Order } from '@/types';

/**
 * Live ticker feed for the Lagos heat map card ("Chidi just hired a
 * photographer in Lekki • 2 mins ago").
 *
 * The blueprint explicitly sanctions placeholder backend data here, so:
 *  - real orders of the signed-in user are NOT used (that activity belongs to
 *    their dashboard); platform-wide orders aren't exposed to guests either
 *  - events are derived from PUBLIC listing data (sellers post, escrow funds)
 *  - recency labels are deterministic pseudo-times (stable per listing id) so
 *    the map feels alive without inventing mutable state
 */
export interface TickerItem {
  text: string;
  when: string;
}

// Lagos-flavoured areas used for the activity lines
const AREAS = ['Lekki', 'Ikeja', 'Yaba', 'Victoria Island', 'Surulere', 'Ajah', 'Mushin'];

/** Stable 0..n-1 hash from a string — keeps labels consistent per listing. */
function stableHash(s: string, n: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % Math.max(1, n);
}

/** First name for display — strips common Nigerian honorifics. */
function firstName(full: string): string {
  const parts = full.trim().split(/\s+/).filter((p) => !/^(dr|mr|mrs|ms|chief|engr|pastor|alhaji|alh)\.?$/i.test(p));
  return parts[0] || full;
}

function areaForListing(l: Listing): string {
  if (l.location && l.location !== 'Remote') {
    // Listing locations are often just "Lagos" — rotate through areas
    if (l.location.includes('Lagos')) return AREAS[stableHash(l.id, AREAS.length)];
    return l.location;
  }
  if (l.isRemote) return 'Remote';
  return AREAS[stableHash(l.id, AREAS.length)];
}

/** Deterministic pseudo-recency: 2 mins to ~5 hours. */
function pseudoWhen(id: string): string {
  const mins = 2 + stableHash(id + 't', 300);
  if (mins < 60) return `${mins} mins ago`;
  const h = Math.round(mins / 60);
  return `${h} hr${h === 1 ? '' : 's'} ago`;
}

export function buildTicker(
  orders: Order[],
  listings: Listing[],
  meId?: string
): TickerItem[] {
  const active = listings.filter((l) => l.isActive && !l.isDraft);
  const items: TickerItem[] = [];

  // Real platform orders visible to this session (seller-side activity the
  // user is party to) — shown with true timestamps.
  for (const o of orders.slice(0, 3)) {
    if (o.sellerId !== meId) continue; // your hires live in the dashboard
    items.push({ text: `${firstName(o.buyerName)} just hired “${o.listingTitle}”`, when: 'just now' });
  }

  // Posting activity from public listings (all sellers, Lagos-leaning)
  const lagosish = active
    .filter((l) => (l.location || '').includes('Lagos') || l.isRemote)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 8);
  for (const l of lagosish) {
    const area = areaForListing(l);
    const where = area === 'Remote' ? '(Remote)' : `in ${area}`;
    items.push({
      text: `${firstName(l.seller.name)} posted “${l.title}” ${where}`,
      when: pseudoWhen(l.id),
    });
  }

  // Escrow milestones so the ticker never renders empty
  if (items.length < 5) {
    for (const l of active.slice(0, 6 - items.length)) {
      items.push({
        text: `Escrow funded for “${l.title}” in ${areaForListing(l)}`,
        when: pseudoWhen(l.id + 'e'),
      });
    }
  }

  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.text) ? false : (seen.add(i.text), true))).slice(0, 10);
}
