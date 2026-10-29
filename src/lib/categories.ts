import type { Listing } from '@/types';

const slugToType: Record<string, Listing['type']> = {
  gigs: 'gig',
  gig: 'gig',
  tasks: 'task',
  task: 'task',
  jobs: 'job',
  job: 'job',
  services: 'service',
  service: 'service',
  digital: 'digital',
};

// Home page pills and other shortcuts that don't map to a top level type
const aliases: Record<string, (l: Listing) => boolean> = {
  'home-help': (l) =>
    l.type === 'task' && ['errands', 'cleaning', 'organization', 'shopping'].includes(l.category.toLowerCase()),
  'tech-support': (l) =>
    l.category.toLowerCase() === 'coding' || l.tags.some((t) => t.toLowerCase().includes('tech')),
};

export function slugify(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function matchesCategory(listing: Listing, key: string) {
  if (!key || key === 'all') return true;
  const k = slugify(key);
  if (slugToType[k]) return listing.type === slugToType[k];
  if (aliases[k]) return aliases[k](listing);
  return (
    slugify(listing.category) === k ||
    (listing.subcategory ? slugify(listing.subcategory) === k : false) ||
    listing.tags.some((t) => slugify(t) === k)
  );
}

export function typeLabel(type: Listing['type']) {
  switch (type) {
    case 'gig':
      return 'Gig';
    case 'task':
      return 'Task';
    case 'job':
      return 'Job';
    case 'service':
      return 'Service';
    case 'digital':
      return 'Digital';
  }
}

export const subcategoryByType: Record<Listing['type'], string[]> = {
  gig: ['Writing', 'Design', 'Voiceover', 'Coding', 'Video Editing', 'Translation'],
  task: ['Errands', 'Shopping', 'Delivery', 'Printing', 'Cleaning', 'Organization'],
  job: ['Customer Service', 'Data Entry', 'Virtual Assistant', 'Sales', 'Marketing'],
  service: ['Tutoring', 'Legal', 'Consulting', 'Coaching', 'Repairs', 'Events'],
  digital: ['E-books', 'Templates', 'Music', 'Art', 'Software', 'Courses'],
};

export function commissionRate(role: 'student' | 'general' | 'admin') {
  return role === 'student' ? 0.1 : 0.15;
}

// Paid listing boosts (Postall-style monetisation): one-off fees that pin a
// listing to the top of Browse or flag it as time-sensitive.
export const BOOST_PRICES: Record<'featured' | 'urgent', number> = {
  featured: 2000,
  urgent: 1500,
};
