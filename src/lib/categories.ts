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
  const group = MARKET_GROUPS.find((g) => g.key === k);
  if (group) return group.match(listing);
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
  gig: ['Writing', 'Design', 'Voiceover', 'Coding', 'Video Editing', 'Translation', 'Social Media', 'Photography'],
  task: ['Errands', 'Shopping', 'Delivery', 'Printing', 'Cleaning', 'Organization', 'Market Runs', 'Furniture Moving', 'Queue Standing'],
  job: ['Customer Service', 'Data Entry', 'Virtual Assistant', 'Sales', 'Marketing', 'Riders & Drivers', 'Hospitality', 'Internships'],
  service: ['Tutoring', 'Legal', 'Consulting', 'Coaching', 'Repairs', 'Events', 'Tailoring', 'Generator Repair', 'Barbing & Grooming', 'Home Lessons'],
  digital: ['E-books', 'Templates', 'Music', 'Art', 'Software', 'Courses', 'CV & Cover Letters', 'Past Questions'],
};

// ---------- Marketplace directory (Nigerian-first groups) ----------
// A presentation layer over the type+category model: six groups a Lagos user
// actually thinks in, each matching onto the existing categories/tags so the
// seeds, the posting form and /browse?category= all keep working.
export interface MarketGroup {
  key: string;
  name: string;
  blurb: string;
  icon: 'Home' | 'Wrench' | 'Laptop' | 'GraduationCap' | 'Briefcase' | 'Download';
  match: (l: Listing) => boolean;
}

const inCat = (l: Listing, cats: string[]) => {
  const c = l.category.toLowerCase();
  const s = (l.subcategory || '').toLowerCase();
  return cats.includes(c) || (s && cats.includes(s)) || l.tags.some((t) => cats.includes(t.toLowerCase()));
};

export const MARKET_GROUPS: MarketGroup[] = [
  {
    key: 'home-errands',
    name: 'Home & Errands',
    blurb: 'Cleaning, deliveries, market runs, shopping and standing in the queue, done while you work.',
    icon: 'Home',
    match: (l) =>
      (l.type === 'task' &&
        inCat(l, ['errands', 'shopping', 'delivery', 'cleaning', 'organization', 'market runs', 'furniture moving', 'queue standing', 'printing'])) ||
      (l.type === 'service' && inCat(l, ['cleaning'])),
  },
  {
    key: 'artisans',
    name: 'Artisans & Repairs',
    blurb: 'Tailors, generator and phone repairers, barbers and event pros near you.',
    icon: 'Wrench',
    match: (l) =>
      l.type === 'service' &&
      inCat(l, ['repairs', 'tailoring', 'generator repair', 'barbing & grooming', 'events']),
  },
  {
    key: 'digital-tech',
    name: 'Digital & Tech',
    blurb: 'Design, writing, coding, social media and voiceovers. Delivered online, paid through escrow.',
    icon: 'Laptop',
    match: (l) =>
      (l.type === 'gig' &&
        inCat(l, ['writing', 'design', 'voiceover', 'coding', 'video editing', 'translation', 'social media', 'photography'])) ||
      (l.type === 'digital' && inCat(l, ['software'])),
  },
  {
    key: 'tutoring',
    name: 'Tutoring & Lessons',
    blurb: 'JAMB, WAEC and skill lessons. Online, or at home in your area.',
    icon: 'GraduationCap',
    match: (l) =>
      l.type === 'service' &&
      inCat(l, ['tutoring', 'coaching', 'home lessons']) ||
      (l.type === 'digital' && inCat(l, ['courses', 'past questions'])),
  },
  {
    key: 'jobs',
    name: 'Jobs & Careers',
    blurb: 'Part-time roles, VA work, customer service, riders and internships. Paid per hour or per month.',
    icon: 'Briefcase',
    match: (l) => l.type === 'job',
  },
  {
    key: 'digital',
    name: 'Buy Digital Goods',
    blurb: 'Templates, e-books, CVs, courses and past questions. Instant download, zero meetups.',
    icon: 'Download',
    match: (l) => l.type === 'digital',
  },
];

export function marketGroupByKey(key: string) {
  return MARKET_GROUPS.find((g) => g.key === slugify(key));
}

export function commissionRate(role: 'student' | 'general' | 'admin') {
  return role === 'student' ? 0.1 : 0.15;
}

// Paid listing boosts (Postall-style monetisation): one-off fees that pin a
// listing to the top of Browse or flag it as time-sensitive.
export const BOOST_PRICES: Record<'featured' | 'urgent', number> = {
  featured: 2000,
  urgent: 1500,
};
