import type {
  Conversation,
  Listing,
  ListingType,
  Notification,
  Order,
  PayoutAccount,
  PriceAlert,
  Referral,
  Review,
  SafeSpot,
  SavedSearch,
  Transaction,
  User,
} from '@/types';
import { featuredListings, featuredTaskers } from '@/data/mockData';

export interface StoredUser extends User {
  password: string;
}

export interface DB {
  version: number;
  users: StoredUser[];
  listings: Listing[];
  favourites: Record<string, string[]>;
  orders: Order[];
  conversations: Conversation[];
  transactions: Transaction[];
  payoutAccounts: PayoutAccount[];
  reviews: Review[];
  notifications: Notification[];
  reports: { id: string; listingId: string; reason: string; details: string; reporterId: string; createdAt: string }[];
  resetRequests: { email: string; code: string; createdAt: string }[];
  // v2 additions (borrowed from the Postall architecture review)
  escrowLedger: import('@/types').EscrowRecord[];
  savedSearches: SavedSearch[];
  priceAlerts: PriceAlert[];
  safeSpots: SafeSpot[];
  referrals: Referral[];
}

export const DB_VERSION = 2;
export const DEMO_EMAIL = 'demo@dealmint.ng';
export const DEMO_PASSWORD = 'Demo1234';

const sellerById = Object.fromEntries(featuredListings.map((l) => [l.seller.id, l.seller]));

const daysAgo = (d: number, h = 0) => new Date(Date.now() - d * 86400000 - h * 3600000).toISOString();

// [title, description, type, category, price, priceType, location|null, sellerId, image, tags, orders]
type Row = [string, string, ListingType, string, number, 'fixed' | 'hourly' | 'negotiable', string | null, string, string, string[], number];

const rows: Row[] = [
  ['Website Copywriting & Blog Posts', 'SEO-friendly articles, landing page copy and product descriptions written in clear, persuasive English.', 'gig', 'Writing', 12000, 'fixed', null, 's1', 'planning_meeting', ['writing', 'seo', 'blog'], 64],
  ['Fix Your React or Node Bug', 'I will debug and fix your React, TypeScript or Node.js issue and explain what went wrong.', 'gig', 'Coding', 25000, 'fixed', null, 's3', 'tools_flatlay', ['coding', 'react', 'tech support'], 41],
  ['Professional Voiceover (English & Pidgin)', 'Warm, clear voiceovers for adverts, explainers and audiobooks. Fast turnaround with studio-quality audio.', 'gig', 'Voiceover', 18000, 'fixed', null, 's2', 'creative_work', ['voiceover', 'audio', 'advert'], 27],
  ['Instagram Reel & TikTok Video Editing', 'Punchy edits with captions, transitions and music for short-form social content.', 'gig', 'Video Editing', 10000, 'fixed', null, 's6', 'creative_work', ['video', 'editing', 'social'], 88],
  ['English to Yoruba / Igbo Translation', 'Accurate document and subtitle translation between English, Yoruba and Igbo.', 'gig', 'Translation', 6000, 'fixed', null, 's5', 'planning_meeting', ['translation', 'yoruba', 'igbo'], 19],
  ['Same-Day Document Delivery', 'Fast and safe pickup and delivery of documents and parcels across Lagos Island and Mainland.', 'task', 'Delivery', 2500, 'fixed', 'Lagos', 's4', 'delivery_handoff', ['delivery', 'documents', 'errands'], 301],
  ['Deep House Cleaning', 'Thorough cleaning for apartments and offices, with my own supplies and equipment.', 'task', 'Cleaning', 15000, 'fixed', 'Abuja', 's4', 'category_tasks', ['cleaning', 'home help', 'house'], 73],
  ['Printing, Photocopy & Binding', 'Colour and black-and-white printing with binding. Pickup or delivery within Yaba.', 'task', 'Printing', 1500, 'fixed', 'Lagos', 's2', 'tools_flatlay', ['printing', 'documents', 'students'], 142],
  ['Wardrobe & Home Organisation', 'I will declutter and organise your wardrobe, kitchen or storeroom in a single visit.', 'task', 'Organization', 9000, 'fixed', 'Port Harcourt', 's6', 'category_tasks', ['organisation', 'home help', 'cleaning'], 35],
  ['Customer Support Agent (Remote)', 'Friendly, reliable chat and email support agent. Available weekdays and some weekends.', 'job', 'Customer Service', 4000, 'hourly', 'Remote', 's2', 'category_jobs', ['support', 'customer service', 'remote'], 52],
  ['Social Media Manager', 'I will plan, schedule and report on your social media content across Instagram, X and LinkedIn.', 'job', 'Marketing', 120000, 'fixed', 'Remote', 's1', 'hero_team_collab', ['marketing', 'social media', 'remote'], 22],
  ['Sales Development Representative', 'Outbound prospecting and lead qualification for B2B and SaaS teams.', 'job', 'Sales', 6000, 'hourly', 'Lagos', 's3', 'category_jobs', ['sales', 'b2b', 'leads'], 14],
  ['JAMB & WAEC English Lessons', 'Exam-focused English tutoring with past questions and weekly mock tests.', 'service', 'Tutoring', 5000, 'hourly', 'Abuja', 's3', 'category_services', ['tutoring', 'english', 'jamb'], 118],
  ['Business Registration Advice', 'Guidance on CAC registration, tax and contracts for small businesses and startups.', 'service', 'Legal', 20000, 'fixed', 'Lagos', 's5', 'category_services', ['legal', 'business', 'cac'], 31],
  ['Phone & Laptop Repairs', 'Screen replacement, battery swaps and software fixes with a 30-day warranty.', 'service', 'Repairs', 8000, 'negotiable', 'Lagos', 's2', 'tools_flatlay', ['repairs', 'phone', 'tech support'], 96],
  ['Wedding & Event Planning', 'End-to-end planning, vendor coordination and day-of management.', 'service', 'Events', 150000, 'negotiable', 'Port Harcourt', 's6', 'closing_community', ['events', 'wedding', 'planning'], 17],
  ['Fitness Coaching Plan (8 weeks)', 'Personalised workout and meal plan with weekly check-ins on WhatsApp.', 'service', 'Coaching', 30000, 'fixed', null, 's4', 'category_services', ['fitness', 'coaching', 'health'], 48],
  ['Notion Budget & Planner Template', 'A clean, ready-to-use budget tracker and weekly planner for Notion.', 'digital', 'Templates', 3500, 'fixed', null, 's5', 'category_digital', ['notion', 'template', 'productivity'], 410],
  ['Afrobeat Drum Loop Pack', '120 royalty-free drum loops and one-shots for producers.', 'digital', 'Music', 7500, 'fixed', null, 's3', 'category_digital', ['music', 'afrobeat', 'producers'], 233],
  ['Learn Excel for Business (E-book)', 'A practical 90-page e-book covering formulas, pivot tables and dashboards.', 'digital', 'E-books', 2500, 'fixed', null, 's1', 'category_digital', ['excel', 'ebook', 'business'], 560],
  ['Social Media Template Bundle', '50 editable Canva templates for posts, stories and carousels.', 'digital', 'Templates', 4500, 'fixed', null, 's6', 'category_digital', ['canva', 'template', 'social'], 287],
];

const extraListings: Listing[] = rows.map((r, i) => {
  const [title, description, type, category, price, priceType, location, sellerId, image, tags, orders] = r;
  const seller = sellerById[sellerId];
  const reviewCount = Math.max(3, Math.round(orders * 0.35));
  return {
    id: String(7 + i),
    title,
    description,
    type,
    category,
    price,
    priceType,
    location: location || undefined,
    isRemote: !location || location === 'Remote',
    images: [`/images/${image}.jpg`],
    seller,
    rating: Math.round((4.5 + ((i * 7) % 5) / 10) * 10) / 10,
    reviewCount,
    completedOrders: orders,
    tags,
    createdAt: daysAgo(3 + i * 4),
    isFeatured: false,
    isActive: true,
    views: 80 + i * 37,
    deliveryTime: type === 'gig' || type === 'digital' ? (type === 'digital' ? 'Instant download' : '3 days') : undefined,
  };
});

const demoUserBase: StoredUser = {
  id: 'u1',
  name: 'Demo User',
  email: DEMO_EMAIL,
  password: DEMO_PASSWORD,
  phone: '+234 800 123 4567',
  role: 'general',
  isVerified: true,
  phoneVerified: true,
  idVerified: false,
  idStatus: 'none',
  rating: 4.8,
  reviewCount: 23,
  location: 'Lagos, Nigeria',
  bio: 'Virtual assistant and data entry specialist with 3+ years of experience. I help businesses stay organised and efficient.',
  skills: ['Data Entry', 'Virtual Assistant', 'Email Management', 'Scheduling'],
  avatar: '/images/avatar_amara.jpg',
  joinedAt: '2023-06-15',
  walletBalance: 25000,
  settings: {
    emailNotifications: true,
    orderUpdates: true,
    messageAlerts: true,
    marketing: false,
    showPhone: false,
    showLocation: true,
  },
};

function demoSnapshot(): User {
  const { password: _pw, ...rest } = demoUserBase;
  void _pw;
  return rest;
}

const demoListings: Listing[] = [
  {
    id: 'd1',
    title: 'Data Entry & Spreadsheet Cleanup',
    description: 'I will clean, organise and enter your data accurately into Excel or Google Sheets, with fast turnaround.',
    type: 'gig',
    category: 'Writing',
    price: 8000,
    priceType: 'fixed',
    location: 'Lagos',
    isRemote: true,
    images: ['/images/planning_meeting.jpg'],
    seller: demoSnapshot(),
    rating: 4.8,
    reviewCount: 14,
    completedOrders: 31,
    tags: ['data entry', 'excel', 'admin'],
    createdAt: daysAgo(20),
    isFeatured: false,
    isActive: true,
    views: 212,
    deliveryTime: '2 days',
  },
  {
    id: 'd2',
    title: 'Virtual Assistant (Part-time)',
    description: 'Inbox management, scheduling and research support for busy founders and small teams.',
    type: 'job',
    category: 'Virtual Assistant',
    price: 3500,
    priceType: 'hourly',
    location: 'Remote',
    isRemote: true,
    images: ['/images/category_jobs.jpg'],
    seller: demoSnapshot(),
    rating: 4.8,
    reviewCount: 6,
    completedOrders: 9,
    tags: ['virtual assistant', 'admin', 'remote'],
    createdAt: daysAgo(12),
    isFeatured: false,
    isActive: true,
    views: 148,
  },
  {
    id: 'd3',
    title: 'Printing & Document Drop-off (Yaba)',
    description: 'I will print, bind and drop off your documents anywhere around Yaba and Surulere.',
    type: 'task',
    category: 'Printing',
    price: 2000,
    priceType: 'fixed',
    location: 'Lagos',
    isRemote: false,
    images: ['/images/delivery_handoff.jpg'],
    seller: demoSnapshot(),
    rating: 4.8,
    reviewCount: 3,
    completedOrders: 5,
    tags: ['printing', 'documents', 'errands'],
    createdAt: daysAgo(6),
    isFeatured: false,
    isActive: false,
    views: 61,
  },
];

const reviewers: [string, string][] = [
  ['Adaeze O.', '/images/avatar_ngozi.jpg'],
  ['Femi A.', '/images/avatar_tunde.jpg'],
  ['Halima B.', '/images/avatar_kemi.jpg'],
  ['Emeka N.', '/images/avatar_ibrahim.jpg'],
  ['Sade K.', '/images/avatar_chioma.jpg'],
];

const comments = [
  'Delivered ahead of time and exactly what I asked for. Will order again.',
  'Great communication from start to finish. Very professional.',
  'Good quality work. A small revision was handled quickly.',
  'Excellent! Exceeded my expectations and was easy to work with.',
  'Reliable and friendly. Highly recommended.',
  'Smooth experience and fair price for the quality.',
];

const allBaseListings = [...featuredListings, ...extraListings];

const seedReviews: Review[] = allBaseListings.flatMap((l, li) =>
  [0, 1, 2].map((n) => {
    const who = reviewers[(li + n) % reviewers.length];
    return {
      id: `r_${l.id}_${n}`,
      listingId: l.id,
      sellerId: l.seller.id,
      reviewerId: `seed_${(li + n) % reviewers.length}`,
      reviewerName: who[0],
      reviewerAvatar: who[1],
      rating: n === 1 && li % 3 === 0 ? 4 : 5,
      comment: comments[(li + n * 2) % comments.length],
      createdAt: daysAgo(5 + n * 9 + li),
    };
  })
);

const demoTransactions: Transaction[] = [
  { id: 't1', userId: 'u1', type: 'earning', amount: 15000, status: 'completed', description: 'Payment for Logo Design', createdAt: daysAgo(7), reference: 'DM-8F3K2A' },
  { id: 't2', userId: 'u1', type: 'withdrawal', amount: -10000, status: 'completed', description: 'Withdrawal to Bank', createdAt: daysAgo(8), reference: 'DM-4P9X1C' },
  { id: 't3', userId: 'u1', type: 'deposit', amount: 5000, status: 'completed', description: 'Wallet Deposit', createdAt: daysAgo(10), reference: 'DM-7Q2M5D' },
  { id: 't4', userId: 'u1', type: 'earning', amount: 8000, status: 'completed', description: 'Payment for Data Entry', createdAt: daysAgo(12), reference: 'DM-1L6N8E' },
  { id: 't5', userId: 'u1', type: 'bonus', amount: 200, status: 'completed', description: 'Referral Bonus', createdAt: daysAgo(14), reference: 'DM-9B4R7F' },
];

const demoNotifications: Notification[] = [
  { id: 'n1', userId: 'u1', type: 'message', title: 'New message from Chioma', message: 'Thanks! I will start working on it right away.', isRead: false, createdAt: daysAgo(0, 0.04), link: '/dashboard/messages' },
  { id: 'n2', userId: 'u1', type: 'order', title: 'New order received', message: 'Someone ordered "Data Entry & Spreadsheet Cleanup".', isRead: false, createdAt: daysAgo(0, 1), link: '/dashboard/orders' },
  { id: 'n3', userId: 'u1', type: 'payment', title: 'Payment received', message: 'You earned ₦15,000 for Logo Design.', isRead: true, createdAt: daysAgo(7), link: '/dashboard/wallet' },
  { id: 'n4', userId: 'u1', type: 'system', title: 'Verify your ID', message: 'Add a government ID to earn the verified badge and build trust.', isRead: true, createdAt: daysAgo(15), link: '/dashboard/profile' },
];

const demoConversations: Conversation[] = [
  {
    id: 'c1',
    userId: 'u1',
    otherId: 's1',
    otherName: 'Chioma Designs',
    otherAvatar: '/images/avatar_chioma.jpg',
    listingId: '1',
    listingTitle: 'Professional Logo Design',
    demoReplies: true,
    lastReadAt: daysAgo(1),
    updatedAt: daysAgo(0, 0.04),
    messages: [
      { id: 'm1', senderId: 's1', content: 'Hi! I saw your gig for logo design.', createdAt: daysAgo(0, 1) },
      { id: 'm2', senderId: 'u1', content: 'Hello! Yes, I am available for new projects.', createdAt: daysAgo(0, 0.95) },
      { id: 'm3', senderId: 's1', content: 'Great! I need a logo for my new business.', createdAt: daysAgo(0, 0.9) },
      { id: 'm4', senderId: 'u1', content: 'I would love to help. Can you tell me more about your business?', createdAt: daysAgo(0, 0.8) },
      { id: 'm5', senderId: 's1', content: 'It is a tech startup focused on fintech solutions.', createdAt: daysAgo(0, 0.7) },
      { id: 'm6', senderId: 's1', content: 'Thanks! I will start working on it right away.', createdAt: daysAgo(0, 0.04) },
    ],
  },
  {
    id: 'c2',
    userId: 'u1',
    otherId: 's4',
    otherName: 'Tunde Delivery',
    otherAvatar: '/images/avatar_tunde.jpg',
    listingId: '4',
    listingTitle: 'Grocery Shopping & Delivery',
    demoReplies: true,
    lastReadAt: daysAgo(0),
    updatedAt: daysAgo(0, 1),
    messages: [
      { id: 'm1', senderId: 'u1', content: 'Hi Tunde, are you available this afternoon?', createdAt: daysAgo(0, 2) },
      { id: 'm2', senderId: 's4', content: 'I am on my way to your location.', createdAt: daysAgo(0, 1) },
    ],
  },
  {
    id: 'c3',
    userId: 'u1',
    otherId: 's3',
    otherName: 'Dr. Ibrahim',
    otherAvatar: '/images/avatar_ibrahim.jpg',
    listingId: '3',
    listingTitle: 'Math & Physics Tutoring',
    demoReplies: true,
    lastReadAt: daysAgo(1),
    updatedAt: daysAgo(0, 3),
    messages: [
      { id: 'm1', senderId: 'u1', content: 'Good morning Dr. Ibrahim, I would like to book a session.', createdAt: daysAgo(0, 5) },
      { id: 'm2', senderId: 's3', content: 'Can we reschedule to 3 PM?', createdAt: daysAgo(0, 3) },
    ],
  },
  {
    // A message request: a new contact reached out first and Demo User has not replied yet,
    // so it stays in the Requests tab until they respond.
    id: 'c4',
    userId: 'u1',
    otherId: 's5',
    otherName: 'Ngozi Templates',
    otherAvatar: '/images/avatar_kemi.jpg',
    listingId: '5',
    listingTitle: 'Notion Budget & Planner Template',
    demoReplies: true,
    lastReadAt: daysAgo(2),
    updatedAt: daysAgo(1),
    messages: [
      { id: 'm1', senderId: 's5', content: 'Hello! I saw your data entry gig. Do you also handle Notion template setup?', createdAt: daysAgo(1) },
      { id: 'm2', senderId: 's5', content: 'I would need about 40 rows migrated into my planner each week.', createdAt: daysAgo(1) },
    ],
  },
];

function seedOrders(): Order[] {
  const l1 = featuredListings[0];
  return [
    {
      id: 'o_seed_1',
      listingId: l1.id,
      listingTitle: l1.title,
      listingType: l1.type,
      listingImage: l1.images[0],
      buyerId: 'u1',
      buyerName: 'Demo User',
      buyerAvatar: '/images/avatar_amara.jpg',
      sellerId: l1.seller.id,
      sellerName: l1.seller.name,
      sellerAvatar: l1.seller.avatar,
      status: 'delivered',
      price: l1.price,
      fee: Math.round(l1.price * 0.15),
      note: 'Logo for a fintech startup, deep purple and gold.',
      deliveryNote: 'Final files attached: PNG, SVG and brand colours.',
      createdAt: daysAgo(4),
      demoSeller: true,
      downloadToken: 'dl_seed1demo',
      downloads: 0,
      timeline: [
        { status: 'pending', at: daysAgo(4) },
        { status: 'in_progress', at: daysAgo(3.5) },
        { status: 'delivered', at: daysAgo(1), note: 'Final files attached: PNG, SVG and brand colours.' },
      ],
    },
    {
      id: 'o_seed_2',
      listingId: 'd1',
      listingTitle: 'Data Entry & Spreadsheet Cleanup',
      listingType: 'gig',
      listingImage: '/images/planning_meeting.jpg',
      buyerId: 's2',
      buyerName: 'Amara Okafor',
      buyerAvatar: '/images/avatar_amara.jpg',
      sellerId: 'u1',
      sellerName: 'Demo User',
      sellerAvatar: '/images/avatar_amara.jpg',
      status: 'pending',
      price: 8000,
      fee: 1200,
      note: 'About 400 rows of customer records to tidy up.',
      createdAt: daysAgo(0, 1),
      timeline: [{ status: 'pending', at: daysAgo(0, 1) }],
    },
  ];
}

function seedEscrowLedger(): import('@/types').EscrowRecord[] {
  const l1 = featuredListings[0];
  const fee = Math.round(l1.price * 0.15);
  return [
    {
      id: 'e_seed_1',
      orderId: 'o_seed_1',
      listingTitle: l1.title,
      amount: l1.price,
      buyerId: 'u1',
      sellerId: l1.seller.id,
      status: 'funded',
      fundedAt: daysAgo(4),
      autoReleaseAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      commission: fee,
      payout: l1.price - fee,
    },
    {
      id: 'e_seed_2',
      orderId: 'o_seed_2',
      listingTitle: 'Data Entry & Spreadsheet Cleanup',
      amount: 8000,
      buyerId: 's2',
      sellerId: 'u1',
      status: 'funded',
      fundedAt: daysAgo(0, 1),
      autoReleaseAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      commission: 1200,
      payout: 6800,
    },
  ];
}

function seedSafeSpots(): SafeSpot[] {
  const at = (d: number) => daysAgo(d);
  return [
    { id: 'ss1', name: 'Ikeja Police Division', type: 'police_station', address: '2 Obafemi Awolowo Way, Allen Avenue', city: 'Lagos', isApproved: true, createdAt: at(30) },
    { id: 'ss2', name: 'Ikeja City Mall', type: 'mall', address: 'Obafemi Awolowo Way, Alausa', city: 'Lagos', isApproved: true, createdAt: at(28) },
    { id: 'ss3', name: 'GTBank Lekki Phase 1', type: 'bank', address: 'Admiralty Way, Lekki Phase 1', city: 'Lagos', isApproved: true, createdAt: at(25) },
    { id: 'ss4', name: 'Cafe Neo Victoria Island', type: 'restaurant', address: '24 Akin Adesola Street', city: 'Lagos', isApproved: true, createdAt: at(21) },
    { id: 'ss5', name: 'Wuse II Police Station', type: 'police_station', address: 'Aminu Kano Crescent, Wuse II', city: 'Abuja', isApproved: true, createdAt: at(20) },
    { id: 'ss6', name: 'Jabi Lake Mall', type: 'mall', address: 'Bala Sokoto Way, Jabi', city: 'Abuja', isApproved: true, createdAt: at(18) },
    { id: 'ss7', name: 'Nike Lake Resort Cafe', type: 'restaurant', address: 'Nike Lake Road, Trans-Ekulu', city: 'Port Harcourt', isApproved: true, createdAt: at(15) },
    { id: 'ss8', name: 'Port Harcourt Main Library', type: 'library', address: '4 Birabi Street, GRA', city: 'Port Harcourt', isApproved: true, createdAt: at(12) },
    { id: 'ss9', name: 'Heritage Mall Ibadan', type: 'mall', address: 'Dugbe Market Area', city: 'Ibadan', isApproved: true, createdAt: at(10) },
    { id: 'ss10', name: 'First Bank Bodija', type: 'bank', address: 'Onireke GRA, Bodija', city: 'Ibadan', isApproved: true, createdAt: at(8) },
  ];
}

function seedSavedSearches(): SavedSearch[] {
  return [
    {
      id: 'sv1',
      userId: 'u1',
      label: 'Logo design',
      query: 'logo',
      type: 'gig',
      category: 'all',
      where: 'all',
      price: 'all',
      frequency: 'instant',
      baseline: -1,
      createdAt: daysAgo(3),
      active: true,
    },
    {
      id: 'sv2',
      userId: 'u1',
      label: 'Delivery in Lagos',
      query: '',
      type: 'task',
      category: 'delivery',
      where: 'Lagos',
      price: 'all',
      frequency: 'daily',
      baseline: -1,
      createdAt: daysAgo(6),
      active: true,
    },
  ];
}

function seedPriceAlerts(): PriceAlert[] {
  const l3 = featuredListings.find((l) => l.id === '3') || featuredListings[2];
  return [
    {
      id: 'al1',
      userId: 'u1',
      listingId: l3.id,
      listingTitle: l3.title,
      targetPrice: Math.round(l3.price * 0.9),
      startPrice: l3.price,
      active: true,
      triggered: false,
      createdAt: daysAgo(5),
    },
  ];
}

export function buildSeedDB(): DB {
  return {
    version: DB_VERSION,
    users: [demoUserBase],
    listings: [...demoListings, ...featuredListings, ...extraListings],
    favourites: { u1: ['3', '5'] },
    orders: seedOrders(),
    conversations: demoConversations,
    transactions: demoTransactions,
    payoutAccounts: [
      { id: 'pa1', userId: 'u1', kind: 'bank', bankName: 'GTBank', accountNumber: '0123456789', accountName: 'Demo User' },
    ],
    reviews: seedReviews,
    notifications: demoNotifications,
    reports: [],
    resetRequests: [],
    escrowLedger: seedEscrowLedger(),
    savedSearches: seedSavedSearches(),
    priceAlerts: seedPriceAlerts(),
    safeSpots: seedSafeSpots(),
    referrals: [],
  };
}

// Upgrade a v1 database in place so returning visitors keep their data.
export function migrateDB(prev: DB): DB {
  if (prev.version === DB_VERSION) return prev;
  const fresh = buildSeedDB();
  return {
    ...fresh,
    ...prev,
    version: DB_VERSION,
    escrowLedger: prev.escrowLedger || fresh.escrowLedger,
    savedSearches: prev.savedSearches || [],
    priceAlerts: prev.priceAlerts || [],
    safeSpots: prev.safeSpots && prev.safeSpots.length > 0 ? prev.safeSpots : fresh.safeSpots,
    referrals: prev.referrals || [],
  };
}

export const sellerDirectory: User[] = [...featuredTaskers];
