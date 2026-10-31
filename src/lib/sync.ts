// Dealmint sync engine — Appwrite Cloud as source of truth, localStorage as
// an offline-first mirror. Every function here degrades gracefully: when the
// cloud is unreachable or unprovisioned the app simply runs on the mirror.
import type { DB, StoredUser } from '@/data/seed';
import type {
  Conversation,
  EscrowRecord,
  Listing,
  Message,
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
import {
  AW_DB,
  Permission,
  Query,
  Role,
  client as awClient,
  cloudConfigured,
  databases,
} from './appwrite';

export type Doc = { $id: string; $createdAt?: string; $updatedAt?: string; [k: string]: unknown };

// ---------------------------------------------------------------------------
// state
// ---------------------------------------------------------------------------
let cloudActive = false;
export const isCloudActive = () => cloudActive && cloudConfigured && !!databases;
export const setCloudActive = (v: boolean) => {
  cloudActive = v;
};

export const COL = {
  users: 'users',
  listings: 'listings',
  favourites: 'favourites',
  orders: 'orders',
  conversations: 'conversations',
  messages: 'messages',
  transactions: 'transactions',
  escrow: 'escrow_ledger',
  payoutAccounts: 'payout_accounts',
  reviews: 'reviews',
  notifications: 'notifications',
  reports: 'reports',
  savedSearches: 'saved_searches',
  priceAlerts: 'price_alerts',
  safeSpots: 'safe_spots',
  referrals: 'referrals',
} as const;

// ---------- id helpers ----------
export const convoDocId = (a: string, b: string) => {
  const [x, y] = [a, b].sort();
  return `cv_${x}_${y}`;
};
export const msgDocId = (convId: string, mid: string) => `${convId}_${mid}`;
export const midFromDoc = (convId: string, docId: string) => docId.slice(convId.length + 1);
export const favDocId = (userId: string, listingId: string) => `f_${userId}_${listingId}`;

// ---------- small mappers ----------
const s = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');
const sU = (v: unknown, max: number): string | undefined => (v ? s(v, max) : undefined);
const n = (v: unknown, d = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const j = <T,>(raw: unknown, fallback: T): T => {
  if (typeof raw !== 'string' || !raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};
const iso = (d: Doc): string => d.$createdAt || new Date().toISOString();

function isNpcUser(settingsRaw: unknown): boolean {
  const st = j<Record<string, unknown>>(settingsRaw, {});
  return st.npc === true;
}

// ---------------------------------------------------------------------------
// toDoc / fromDoc mappers
// ---------------------------------------------------------------------------

// ---- users ----
export function userFromDoc(d: Doc): StoredUser {
  return {
    id: d.$id,
    name: s(d.name, 256) || 'User',
    email: s(d.email, 320),
    avatar: sU(d.avatar, 2048),
    role: (d.role as StoredUser['role']) || 'general',
    isVerified: !!d.isVerified,
    phoneVerified: !!d.phoneVerified,
    idVerified: !!d.idVerified,
    rating: n(d.rating),
    reviewCount: n(d.reviewCount),
    location: sU(d.location, 256),
    bio: sU(d.bio, 2000),
    skills: Array.isArray(d.skills) ? (d.skills as string[]) : undefined,
    phone: sU(d.phone, 64),
    website: sU(d.website, 512),
    idStatus: (d.idStatus as StoredUser['idStatus']) || undefined,
    idDocType: sU(d.idDocType, 64),
    studentVerified: typeof d.studentVerified === 'boolean' ? (d.studentVerified as boolean) : undefined,
    walletBalance: n(d.walletBalance),
    theme: (d.theme as 'light' | 'dark') || undefined,
    settings: j<StoredUser['settings']>(d.settings, undefined as StoredUser['settings']),
    joinedAt: sU(d.joinedAt, 64) || iso(d).slice(0, 10),
    // Cloud passwords live in Appwrite Auth; the mirror never uses this field.
    password: '',
  };
}

export function userToDoc(u: StoredUser) {
  return {
    name: s(u.name, 256),
    email: s(u.email, 320).toLowerCase(),
    avatar: s(u.avatar, 2048),
    role: u.role,
    isVerified: !!u.isVerified,
    phoneVerified: !!u.phoneVerified,
    idVerified: !!u.idVerified,
    rating: u.rating ?? 0,
    reviewCount: u.reviewCount ?? 0,
    location: s(u.location, 256),
    bio: s(u.bio, 2000),
    skills: (u.skills || []).map((k) => s(k, 128)),
    phone: s(u.phone, 64),
    website: s(u.website, 512),
    idStatus: u.idStatus || 'none',
    idDocType: s(u.idDocType, 64),
    studentVerified: !!u.studentVerified,
    walletBalance: u.walletBalance ?? 0,
    joinedAt: s(u.joinedAt, 64),
    ...(u.theme ? { theme: u.theme } : {}),
    settings: JSON.stringify({ ...(u.settings || {}) }).slice(0, 4096),
  };
}

export const npcToDoc = (u: StoredUser) => ({ ...userToDoc(u), settings: JSON.stringify({ ...(u.settings || {}), npc: true }).slice(0, 4096) });

// ---- listings ----
export function listingFromDoc(d: Doc, usersById: Map<string, StoredUser>): Listing {
  const sellerId = s(d.sellerId, 64);
  const stored = usersById.get(sellerId);
  const seller: User = stored
    ? ({ ...stored, password: undefined as unknown as string } as unknown as User)
    : {
        id: sellerId || 'unknown',
        name: s(d.sellerName, 256) || 'Seller',
        email: '',
        avatar: sU(d.sellerAvatar, 2048),
        role: 'general',
        isVerified: true,
        phoneVerified: true,
        idVerified: false,
        rating: n(d.rating),
        reviewCount: n(d.reviewCount),
        walletBalance: 0,
        joinedAt: iso(d).slice(0, 10),
      };
  return {
    id: d.$id,
    title: s(d.title, 256),
    description: s(d.description, 8000),
    type: (d.type as Listing['type']) || 'gig',
    category: s(d.category, 128),
    subcategory: sU(d.subcategory, 128),
    price: n(d.price),
    priceType: (d.priceType as Listing['priceType']) || 'fixed',
    location: sU(d.location, 256),
    isRemote: !!d.isRemote,
    images: Array.isArray(d.images) ? (d.images as string[]) : [],
    seller,
    rating: n(d.rating),
    reviewCount: n(d.reviewCount),
    completedOrders: n(d.completedOrders),
    tags: Array.isArray(d.tags) ? (d.tags as string[]) : [],
    createdAt: iso(d),
    isFeatured: !!d.isFeatured,
    isUrgent: !!d.isUrgent || undefined,
    isActive: d.isActive === undefined ? true : !!d.isActive,
    isDraft: !!d.isDraft || undefined,
    views: d.views === undefined || d.views === null ? undefined : n(d.views),
    deliveryTime: sU(d.deliveryTime, 128),
    requirements: sU(d.requirements, 4000),
    salaryType: sU(d.salaryType, 64),
    deadline: sU(d.deadline, 64),
    fileName: sU(d.fileName, 512),
    fileSize: d.fileSize === undefined || d.fileSize === null ? undefined : n(d.fileSize),
    fileType: sU(d.fileType, 128),
  };
}

export function listingToDoc(l: Listing) {
  return {
    title: s(l.title, 256),
    description: s(l.description, 3000),
    type: l.type,
    category: s(l.category, 128),
    subcategory: s(l.subcategory, 128),
    price: l.price ?? 0,
    priceType: l.priceType,
    location: s(l.location, 256),
    isRemote: !!l.isRemote,
    images: (l.images || []).filter((i) => i.length <= 2048),
    sellerId: s(l.seller.id, 64),
    sellerName: s(l.seller.name, 256),
    sellerAvatar: s(l.seller.avatar, 512),
    rating: l.rating ?? 0,
    reviewCount: l.reviewCount ?? 0,
    completedOrders: l.completedOrders ?? 0,
    tags: (l.tags || []).map((t) => s(t, 64)),
    isFeatured: !!l.isFeatured,
    isUrgent: !!l.isUrgent,
    isActive: !!l.isActive,
    isDraft: !!l.isDraft,
    views: l.views ?? 0,
    deliveryTime: s(l.deliveryTime, 128),
    requirements: s(l.requirements, 1500),
    salaryType: s(l.salaryType, 64),
    deadline: s(l.deadline, 64),
    fileName: s(l.fileName, 256),
    fileSize: l.fileSize,
    fileType: s(l.fileType, 128),
  };
}

// ---- orders ----
export function orderFromDoc(d: Doc): Order {
  return {
    id: d.$id,
    listingId: s(d.listingId, 64),
    listingTitle: s(d.listingTitle, 256),
    listingType: (d.listingType as Order['listingType']) || 'gig',
    listingImage: sU(d.listingImage, 2048),
    buyerId: s(d.buyerId, 64),
    buyerName: s(d.buyerName, 256),
    buyerAvatar: sU(d.buyerAvatar, 2048),
    sellerId: s(d.sellerId, 64),
    sellerName: s(d.sellerName, 256),
    sellerAvatar: sU(d.sellerAvatar, 2048),
    status: (d.status as Order['status']) || 'pending',
    price: n(d.price),
    fee: n(d.fee),
    note: sU(d.note, 2000),
    deliveryNote: sU(d.deliveryNote, 2000),
    meetup: j<Order['meetup']>(d.meetup, undefined as Order['meetup']),
    createdAt: iso(d),
    completedAt: sU(d.completedAt, 64),
    timeline: j<Order['timeline']>(d.timeline, []),
    reviewed: !!d.reviewed || undefined,
    demoSeller: !!d.demoSeller || undefined,
    downloadToken: sU(d.downloadToken, 128),
    downloads: d.downloads === undefined || d.downloads === null ? undefined : n(d.downloads),
  };
}

export function orderToDoc(o: Order) {
  return {
    listingId: s(o.listingId, 64),
    listingTitle: s(o.listingTitle, 256),
    listingType: o.listingType,
    listingImage: s(o.listingImage, 512),
    buyerId: s(o.buyerId, 64),
    buyerName: s(o.buyerName, 256),
    buyerAvatar: s(o.buyerAvatar, 512),
    sellerId: s(o.sellerId, 64),
    sellerName: s(o.sellerName, 256),
    sellerAvatar: s(o.sellerAvatar, 512),
    status: o.status,
    price: o.price ?? 0,
    fee: o.fee ?? 0,
    note: s(o.note, 800),
    deliveryNote: s(o.deliveryNote, 800),
    meetup: o.meetup ? JSON.stringify(o.meetup).slice(0, 800) : '',
    completedAt: s(o.completedAt, 64),
    // keep the last 20 events so the JSON always fits the 4000-char attribute
    timeline: JSON.stringify((o.timeline || []).slice(-20)).slice(0, 4000),
    reviewed: !!o.reviewed,
    demoSeller: !!o.demoSeller,
    downloadToken: s(o.downloadToken, 128),
    downloads: o.downloads ?? 0,
  };
}

// ---- conversations (canonical pair doc <-> per-user view) ----
export function convoPatchFromView(c: Conversation, cached: Doc | null) {
  const [a, b] = [c.userId, c.otherId].sort();
  const lastMessageAt = c.messages.length ? c.messages[c.messages.length - 1].createdAt : '';
  const iAmA = c.userId <= c.otherId;
  return {
    userA: a,
    userB: b,
    listingId: sU(c.listingId, 64),
    listingTitle: sU(c.listingTitle, 256),
    lastMessageAt: s(lastMessageAt, 64),
    lastReadA: iAmA ? s(c.lastReadAt, 64) : s(cached?.lastReadA, 64),
    lastReadB: iAmA ? s(cached?.lastReadB, 64) : s(c.lastReadAt, 64),
    blocked: !!c.blocked,
    demoReplies: !!c.demoReplies,
    escrowChatUnlocked: !!c.escrowChatUnlocked,
  };
}

export function messageFromDoc(convId: string, d: Doc): Message {
  return {
    id: midFromDoc(convId, d.$id),
    senderId: s(d.senderId, 64),
    content: s(d.content, 8000),
    createdAt: iso(d),
    attachment: j<Message['attachment']>(d.attachment, undefined as Message['attachment']),
  };
}

export function messageToDoc(convId: string, m: Message) {
  return {
    conversationId: convId,
    senderId: s(m.senderId, 64),
    content: s(m.content, 8000),
    attachment: m.attachment ? JSON.stringify(m.attachment).slice(0, 1024) : '',
  };
}

/** Rebuild my per-user view from the canonical doc + that convo's messages. */
export function convoViewFromDoc(
  d: Doc,
  msgs: Message[],
  me: string,
  usersById: Map<string, StoredUser>,
): Conversation {
  const a = s(d.userA, 64);
  const b = s(d.userB, 64);
  const other = me === a ? b : a;
  const u = usersById.get(other);
  const iAmA = me === a;
  const lastReadAt = (iAmA ? s(d.lastReadA, 64) : s(d.lastReadB, 64)) || new Date(0).toISOString();
  const updatedAt = s(d.lastMessageAt, 64) || iso(d);
  return {
    id: d.$id,
    userId: me,
    otherId: other,
    otherName: u?.name || `User ${other.slice(0, 6)}`,
    otherAvatar: u?.avatar,
    listingId: sU(d.listingId, 64),
    listingTitle: sU(d.listingTitle, 256),
    messages: msgs,
    lastReadAt,
    updatedAt,
    blocked: !!d.blocked || undefined,
    demoReplies: !!d.demoReplies || undefined,
    escrowChatUnlocked: !!d.escrowChatUnlocked || undefined,
  };
}

// ---- simple collections ----
export const txFromDoc = (d: Doc): Transaction => ({
  id: d.$id,
  userId: s(d.userId, 64),
  type: (d.type as Transaction['type']) || 'bonus',
  amount: n(d.amount),
  status: (d.status as Transaction['status']) || 'completed',
  description: s(d.description, 512),
  createdAt: iso(d),
  reference: sU(d.reference, 256),
  orderId: sU(d.orderId, 64),
  fee: d.fee === undefined || d.fee === null ? undefined : n(d.fee),
});
export const txToDoc = (t: Transaction) => ({
  userId: s(t.userId, 64),
  type: t.type,
  amount: t.amount ?? 0,
  status: t.status,
  description: s(t.description, 512),
  reference: s(t.reference, 256),
  orderId: s(t.orderId, 64),
  fee: t.fee,
});

export const escrowFromDoc = (d: Doc): EscrowRecord => ({
  id: d.$id,
  orderId: s(d.orderId, 64),
  listingTitle: s(d.listingTitle, 256),
  amount: n(d.amount),
  buyerId: s(d.buyerId, 64),
  sellerId: s(d.sellerId, 64),
  status: (d.status as EscrowRecord['status']) || 'funded',
  fundedAt: s(d.fundedAt, 64) || iso(d),
  autoReleaseAt: s(d.autoReleaseAt, 64) || iso(d),
  releasedAt: sU(d.releasedAt, 64),
  commission: n(d.commission),
  payout: n(d.payout),
});
export const escrowToDoc = (e: EscrowRecord) => ({
  orderId: s(e.orderId, 64),
  listingTitle: s(e.listingTitle, 256),
  amount: e.amount ?? 0,
  buyerId: s(e.buyerId, 64),
  sellerId: s(e.sellerId, 64),
  status: e.status,
  fundedAt: s(e.fundedAt, 64),
  autoReleaseAt: s(e.autoReleaseAt, 64),
  releasedAt: s(e.releasedAt, 64),
  commission: e.commission ?? 0,
  payout: e.payout ?? 0,
});

export const payoutFromDoc = (d: Doc): PayoutAccount => ({
  id: d.$id,
  userId: s(d.userId, 64),
  kind: (d.kind as PayoutAccount['kind']) || 'bank',
  bankName: s(d.bankName, 256),
  accountNumber: s(d.accountNumber, 64),
  accountName: s(d.accountName, 256),
});
export const payoutToDoc = (p: PayoutAccount) => ({
  userId: s(p.userId, 64),
  kind: p.kind,
  bankName: s(p.bankName, 256),
  accountNumber: s(p.accountNumber, 64),
  accountName: s(p.accountName, 256),
});

export const reviewFromDoc = (d: Doc): Review => ({
  id: d.$id,
  listingId: s(d.listingId, 64),
  sellerId: s(d.sellerId, 64),
  orderId: sU(d.orderId, 64),
  reviewerId: s(d.reviewerId, 64),
  reviewerName: s(d.reviewerName, 256),
  reviewerAvatar: sU(d.reviewerAvatar, 2048),
  rating: n(d.rating, 5),
  comment: s(d.comment, 2000),
  createdAt: iso(d),
  reply: sU(d.reply, 2000),
});
export const reviewToDoc = (r: Review) => ({
  listingId: s(r.listingId, 64),
  sellerId: s(r.sellerId, 64),
  orderId: s(r.orderId, 64),
  reviewerId: s(r.reviewerId, 64),
  reviewerName: s(r.reviewerName, 256),
  reviewerAvatar: s(r.reviewerAvatar, 512),
  rating: r.rating ?? 5,
  comment: s(r.comment, 2000),
  reply: s(r.reply, 2000),
});

export const notifFromDoc = (d: Doc): Notification => ({
  id: d.$id,
  userId: s(d.userId, 64),
  type: (d.type as Notification['type']) || 'system',
  title: s(d.title, 256),
  message: s(d.message, 2000),
  isRead: !!d.isRead,
  createdAt: iso(d),
  link: sU(d.link, 512),
});
export const notifToDoc = (nt: Notification) => ({
  userId: s(nt.userId, 64),
  type: nt.type,
  title: s(nt.title, 256),
  message: s(nt.message, 2000),
  isRead: !!nt.isRead,
  link: s(nt.link, 512),
});

export const savedFromDoc = (d: Doc): SavedSearch => ({
  id: d.$id,
  userId: s(d.userId, 64),
  label: s(d.label, 256),
  query: s(d.query, 512),
  type: s(d.type, 64) || 'all',
  category: s(d.category, 128) || 'all',
  where: s(d.where, 256) || 'all',
  price: s(d.price, 64) || 'all',
  frequency: (d.frequency as SavedSearch['frequency']) || 'instant',
  baseline: n(d.baseline, -1),
  createdAt: iso(d),
  active: d.active === undefined ? true : !!d.active,
});
export const savedToDoc = (sv: SavedSearch) => ({
  userId: s(sv.userId, 64),
  label: s(sv.label, 256),
  query: s(sv.query, 512),
  type: s(sv.type, 64),
  category: s(sv.category, 128),
  where: s(sv.where, 256),
  price: s(sv.price, 64),
  frequency: sv.frequency,
  baseline: sv.baseline ?? -1,
  active: !!sv.active,
});

export const alertFromDoc = (d: Doc): PriceAlert => ({
  id: d.$id,
  userId: s(d.userId, 64),
  listingId: s(d.listingId, 64),
  listingTitle: s(d.listingTitle, 256),
  targetPrice: n(d.targetPrice),
  startPrice: n(d.startPrice),
  active: d.active === undefined ? true : !!d.active,
  triggered: !!d.triggered,
  createdAt: iso(d),
});
export const alertToDoc = (a: PriceAlert) => ({
  userId: s(a.userId, 64),
  listingId: s(a.listingId, 64),
  listingTitle: s(a.listingTitle, 256),
  targetPrice: a.targetPrice ?? 0,
  startPrice: a.startPrice ?? 0,
  active: !!a.active,
  triggered: !!a.triggered,
});

export const spotFromDoc = (d: Doc): SafeSpot => ({
  id: d.$id,
  name: s(d.name, 256),
  type: (d.type as SafeSpot['type']) || 'mall',
  address: s(d.address, 512),
  city: s(d.city, 128),
  lat: d.lat === undefined || d.lat === null ? undefined : n(d.lat),
  lng: d.lng === undefined || d.lng === null ? undefined : n(d.lng),
  isApproved: !!d.isApproved,
  submittedById: sU(d.submittedById, 64),
  createdAt: iso(d),
});
export const spotToDoc = (sp: SafeSpot) => ({
  name: s(sp.name, 256),
  type: sp.type,
  address: s(sp.address, 512),
  city: s(sp.city, 128),
  lat: sp.lat,
  lng: sp.lng,
  isApproved: !!sp.isApproved,
  submittedById: s(sp.submittedById, 64),
});

export const referralFromDoc = (d: Doc): Referral => ({
  id: d.$id,
  referrerId: s(d.referrerId, 64),
  invitedEmail: s(d.invitedEmail, 320),
  invitedName: sU(d.invitedName, 256),
  status: (d.status as Referral['status']) || 'invited',
  reward: n(d.reward),
  createdAt: iso(d),
});
export const referralToDoc = (r: Referral) => ({
  referrerId: s(r.referrerId, 64),
  invitedEmail: s(r.invitedEmail, 320),
  invitedName: s(r.invitedName, 256),
  status: r.status,
  reward: r.reward ?? 0,
});

// ---------------------------------------------------------------------------
// permissions
// ---------------------------------------------------------------------------
const P = Permission;
const both = (a: string, b: string) => [P.read(Role.user(a)), P.read(Role.user(b)), P.update(Role.user(a)), P.update(Role.user(b)), P.delete(Role.user(a)), P.delete(Role.user(b))];

export function docPermissions(col: string, entity: unknown, me: string): string[] {
  switch (col) {
    case COL.users: {
      const u = entity as StoredUser;
      if ((u.settings as Record<string, unknown> | undefined)?.npc) {
        return [P.read(Role.any())];
      }
      return [P.read(Role.user(u.id)), P.read(Role.users()), P.update(Role.user(u.id)), P.delete(Role.user(u.id))];
    }
    case COL.listings: {
      const l = entity as Listing;
      return [P.read(Role.any()), P.update(Role.user(l.seller.id)), P.delete(Role.user(l.seller.id))];
    }
    case COL.reviews: {
      const r = entity as Review;
      return [P.read(Role.any()), P.update(Role.user(r.reviewerId)), P.update(Role.user(r.sellerId))];
    }
    case COL.safeSpots: {
      return [P.read(Role.any()), P.update(Role.user(me)), P.delete(Role.user(me))];
    }
    case COL.orders: {
      const o = entity as Order;
      return both(o.buyerId, o.sellerId);
    }
    case COL.escrow: {
      const e = entity as EscrowRecord;
      return both(e.buyerId, e.sellerId);
    }
    case COL.conversations: {
      const c = entity as Conversation;
      return both(c.userId, c.otherId);
    }
    case COL.messages: {
      const m = entity as { senderId: string; participants: [string, string] };
      return [P.read(Role.user(m.participants[0])), P.read(Role.user(m.participants[1])), P.update(Role.user(m.senderId)), P.delete(Role.user(m.senderId))];
    }
    case COL.notifications: {
      const nt = entity as Notification;
      return [P.read(Role.user(nt.userId)), P.update(Role.user(nt.userId)), P.delete(Role.user(nt.userId))];
    }
    case COL.reports:
      return [];
    default: {
      // owner-scoped: favourites, transactions, payout_accounts, saved_searches,
      // price_alerts, referrals
      return [P.read(Role.user(me)), P.update(Role.user(me)), P.delete(Role.user(me))];
    }
  }
}

// ---------------------------------------------------------------------------
// pull
// ---------------------------------------------------------------------------
async function listAll(col: string, queries: string[] = []): Promise<Doc[]> {
  if (!databases) return [];
  const out: Doc[] = [];
  let cursor: string | undefined;
  // safety bound: 25 pages = 2500 docs per collection
  for (let page = 0; page < 25; page++) {
    const res = await databases.listDocuments(AW_DB, col, [
      ...queries,
      Query.limit(100),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ]);
    out.push(...(res.documents as unknown as Doc[]));
    if (res.documents.length < 100) break;
    cursor = res.documents[res.documents.length - 1].$id;
  }
  return out;
}

export interface PullResult {
  db: Partial<DB>;
  convoDocs: Map<string, Doc>;
}

/** Fetch everything this device is allowed to see. */
export async function pullCloud(me: string | null): Promise<PullResult | null> {
  if (!isCloudActive()) return null;
  try {
    const [listingDocs, spotDocs, reviewDocs] = await Promise.all([
      listAll(COL.listings),
      listAll(COL.safeSpots),
      listAll(COL.reviews),
    ]);
    const usersById = new Map<string, StoredUser>();

    if (me) {
      const [userDocs, myOrderDocs, otherOrderDocs, convoDocs, myTxDocs, favDocs, payoutDocs, reviewOwn, notifDocs, savedDocs, alertDocs, escrowMine, referralDocs] =
        await Promise.all([
          listAll(COL.users),
          listAll(COL.orders, [Query.equal('buyerId', me)]),
          listAll(COL.orders, [Query.equal('sellerId', me)]),
          Promise.all([listAll(COL.conversations, [Query.equal('userA', me)]), listAll(COL.conversations, [Query.equal('userB', me)])]),
          listAll(COL.transactions, [Query.equal('userId', me)]),
          listAll(COL.favourites, [Query.equal('userId', me)]),
          listAll(COL.payoutAccounts, [Query.equal('userId', me)]),
          listAll(COL.reviews, [Query.equal('sellerId', me)]),
          listAll(COL.notifications, [Query.equal('userId', me)]),
          listAll(COL.savedSearches, [Query.equal('userId', me)]),
          listAll(COL.priceAlerts, [Query.equal('userId', me)]),
          Promise.all([listAll(COL.escrow, [Query.equal('buyerId', me)]), listAll(COL.escrow, [Query.equal('sellerId', me)])]),
          listAll(COL.referrals, [Query.equal('referrerId', me)]),
        ]);

      for (const ud of userDocs) usersById.set(ud.$id, userFromDoc(ud));

      const orderDocs = [...myOrderDocs, ...otherOrderDocs];
      const escrowDocs = [...escrowMine[0], ...escrowMine[1]];

      const convDocsAll = [...convoDocs[0], ...convoDocs[1]];
      const convoIds = convDocsAll.map((c) => c.$id);
      const msgDocs = convoIds.length ? await listAll(COL.messages, [Query.equal('conversationId', convoIds)]) : [];
      const msgsByConv = new Map<string, Message[]>();
      for (const md of msgDocs) {
        const convId = s(md.conversationId, 64);
        const arr = msgsByConv.get(convId) || [];
        arr.push(messageFromDoc(convId, md));
        msgsByConv.set(convId, arr);
      }
      for (const arr of msgsByConv.values()) arr.sort((x, y) => x.createdAt.localeCompare(y.createdAt));

      const conversations = convDocsAll
        .filter((cd) => s(cd.userA, 64) === me || s(cd.userB, 64) === me)
        .map((cd) => convoViewFromDoc(cd, msgsByConv.get(cd.$id) || [], me, usersById));

      const favourites: Record<string, string[]> = {};
      for (const fd of favDocs) {
        const uid2 = s(fd.userId, 64);
        (favourites[uid2] ||= []).push(s(fd.listingId, 64));
      }

      return {
        db: {
          users: [...usersById.values()],
          listings: listingDocs.map((d) => listingFromDoc(d, usersById)),
          favourites,
          orders: orderDocs.map(orderFromDoc),
          conversations,
          transactions: myTxDocs.map(txFromDoc),
          payoutAccounts: payoutDocs.map(payoutFromDoc),
          reviews: dedupeById([...reviewDocs, ...reviewOwn].map(reviewFromDoc)),
          notifications: notifDocs.map(notifFromDoc),
          escrowLedger: escrowDocs.map(escrowFromDoc),
          savedSearches: savedDocs.map(savedFromDoc),
          priceAlerts: alertDocs.map(alertFromDoc),
          safeSpots: spotDocs.map(spotFromDoc),
          referrals: referralDocs.map(referralFromDoc),
        },
        convoDocs: new Map(convDocsAll.map((cd) => [cd.$id, cd])),
      };
    }

    // guest scope
    return {
      db: {
        listings: listingDocs.map((d) => listingFromDoc(d, usersById)),
        safeSpots: spotDocs.map(spotFromDoc),
        reviews: reviewDocs.map(reviewFromDoc),
      },
      convoDocs: new Map(),
    };
  } catch {
    return null;
  }
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const it of items) map.set(it.id, it);
  return [...map.values()];
}

// ---------------------------------------------------------------------------
// ack bookkeeping (docs successfully pushed at least once)
// ---------------------------------------------------------------------------
const ACK_KEY = 'dealmint_sync_acked';
let acked = new Set<string>();
try {
  acked = new Set<string>(JSON.parse(localStorage.getItem(ACK_KEY) || '[]'));
} catch {
  acked = new Set();
}
const ackKey = (col: string, id: string) => `${col}:${id}`;
export const hasAcked = (col: string, id: string) => acked.has(ackKey(col, id));
function markAcked(col: string, id: string) {
  acked.add(ackKey(col, id));
  try {
    localStorage.setItem(ACK_KEY, JSON.stringify([...acked].slice(-4000)));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// push queue
// ---------------------------------------------------------------------------
type ReportRow = { id: string; listingId: string; reason: string; details: string; reporterId: string; createdAt: string };

type Op = { col: string; id: string; kind: 'upsert' | 'delete'; payload?: () => Record<string, unknown> | null; perms?: () => string[]; tries: number };
const queue: Op[] = [];
let flushing = false;
let flushTimer: number | undefined;

async function upsertDoc(col: string, id: string, payload: Record<string, unknown>, perms: string[]): Promise<boolean> {
  if (!databases) return false;
  try {
    await databases.createDocument(AW_DB, col, id, payload, perms);
    markAcked(col, id);
    return true;
  } catch (e: unknown) {
    const code = (e as { code?: number }).code;
    if (code === 409) {
      try {
        await databases.updateDocument(AW_DB, col, id, payload, perms);
        markAcked(col, id);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

async function deleteDoc(col: string, id: string): Promise<boolean> {
  if (!databases) return false;
  try {
    await databases.deleteDocument(AW_DB, col, id);
  } catch {
    // 404 etc — treat as done so it stops retrying
  }
  markAcked(col, id);
  return true;
}

async function flush() {
  if (flushing || !isCloudActive() || queue.length === 0) return;
  flushing = true;
  try {
    while (queue.length > 0) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) break; // retry when back online
      const op = queue.shift()!;
      const okResult =
        op.kind === 'delete'
          ? await deleteDoc(op.col, op.id)
          : await (async () => {
              const payload = op.payload?.();
              if (!payload) return true; // nothing to push anymore
              return upsertDoc(op.col, op.id, payload, op.perms?.() || []);
            })();
      if (!okResult) {
        op.tries += 1;
        if (op.tries < 3) queue.push(op); // retry later (offline, paused project…)
        // else: dropped — the local mirror keeps the data
      }
    }
  } finally {
    flushing = false;
  }
}

function schedule() {
  window.clearTimeout(flushTimer);
  flushTimer = window.setTimeout(() => void flush(), 900);
}

// document caches so conversation upserts merge instead of clobber
export const convoCache = new Map<string, Doc>();
export const primeConvoCache = (docs: Map<string, Doc>) => {
  convoCache.clear();
  docs.forEach((v, k) => convoCache.set(k, v));
};

/** Queue a canonical conversation upsert + every unacked message in it. */
function enqueueConversation(c: Conversation) {
  const convId = convoDocId(c.userId, c.otherId);
  queue.push({
    col: COL.conversations,
    id: convId,
    kind: 'upsert',
    tries: 0,
    payload: () => convoPatchFromView(c, convoCache.get(convId) || null),
    perms: () => docPermissions(COL.conversations, c, c.userId),
  });
  for (const m of c.messages) {
    const mid = msgDocId(convId, m.id);
    if (hasAcked(COL.messages, mid)) continue;
    queue.push({
      col: COL.messages,
      id: mid,
      kind: 'upsert',
      tries: 0,
      payload: () => messageToDoc(convId, m),
      perms: () =>
        docPermissions(COL.messages, { senderId: m.senderId, participants: [c.userId, c.otherId] }, c.userId),
    });
  }
}

const sameDoc = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Called after every local commit. Diffs the two snapshots and queues
 * upserts/deletes for everything this user owns.
 */
export function enqueueDiff(prev: DB, next: DB, me: string | null) {
  if (!isCloudActive() || !me) return;

  const diffArray = <T extends { id: string }>(
    col: string,
    before: T[],
    after: T[],
    toDoc: (t: T) => Record<string, unknown> | null,
    perms: (t: T) => string[],
    owned: (t: T) => boolean
  ) => {
    const prevMap = new Map(before.map((x) => [x.id, x]));
    for (const item of after) {
      if (!owned(item)) continue;
      const was = prevMap.get(item.id);
      if (was && sameDoc(toDoc(was), toDoc(item))) continue;
      queue.push({ col, id: item.id, kind: 'upsert', tries: 0, payload: () => toDoc(item), perms: () => perms(item) });
    }
    for (const item of before) {
      if (!owned(item)) continue;
      if (!after.some((x) => x.id === item.id)) {
        queue.push({ col, id: item.id, kind: 'delete', tries: 0 });
      }
    }
  };

  const user = next.users.find((u) => u.id === me);
  const prevUser = prev.users.find((u) => u.id === me);
  if (user && (!prevUser || !sameDoc(userToDoc(prevUser), userToDoc(user)))) {
    queue.push({
      col: COL.users,
      id: user.id,
      kind: 'upsert',
      tries: 0,
      payload: () => userToDoc(user),
      perms: () => docPermissions(COL.users, user, me),
    });
  }

  diffArray(COL.listings, prev.listings, next.listings, listingToDoc, (l) => docPermissions(COL.listings, l, me), (l) => l.seller.id === me);
  diffArray(COL.orders, prev.orders, next.orders, orderToDoc, (o) => docPermissions(COL.orders, o, me), (o) => o.buyerId === me || o.sellerId === me);
  diffArray(COL.transactions, prev.transactions, next.transactions, txToDoc, (t) => docPermissions('owner', t, me), (t) => t.userId === me);
  diffArray(COL.escrow, prev.escrowLedger, next.escrowLedger, escrowToDoc, (e) => docPermissions(COL.escrow, e, me), (e) => e.buyerId === me || e.sellerId === me);
  diffArray(COL.payoutAccounts, prev.payoutAccounts, next.payoutAccounts, payoutToDoc, (p) => docPermissions('owner', p, me), (p) => p.userId === me);
  diffArray(COL.reviews, prev.reviews, next.reviews, reviewToDoc, (r) => docPermissions(COL.reviews, r, me), (r) => r.reviewerId === me);
  diffArray(COL.notifications, prev.notifications, next.notifications, notifToDoc, (nt) => docPermissions(COL.notifications, nt, me), (nt) => nt.userId === me);
  diffArray(COL.savedSearches, prev.savedSearches, next.savedSearches, savedToDoc, (sv) => docPermissions('owner', sv, me), (sv) => sv.userId === me);
  diffArray(COL.priceAlerts, prev.priceAlerts, next.priceAlerts, alertToDoc, (a) => docPermissions('owner', a, me), (a) => a.userId === me);
  diffArray(COL.safeSpots, prev.safeSpots, next.safeSpots, spotToDoc, (sp) => docPermissions(COL.safeSpots, sp, me), (sp) => sp.submittedById === me);
  diffArray(COL.referrals, prev.referrals, next.referrals, referralToDoc, (r) => docPermissions('owner', r, me), (r) => r.referrerId === me);
  diffArray(
    COL.reports,
    prev.reports as unknown as ReportRow[],
    next.reports as unknown as ReportRow[],
    (r) => ({ listingId: s(r.listingId, 64), reason: s(r.reason, 256), details: s(r.details, 2000), reporterId: s(r.reporterId, 64) }),
    () => [],
    (r) => r.reporterId === me
  );

  // favourites map -> composite docs
  if (prev.favourites !== next.favourites) {
    const mine = next.favourites[me] || [];
    const beforeMine = prev.favourites[me] || [];
    for (const lid of mine) {
      if (!beforeMine.includes(lid)) {
        queue.push({
          col: COL.favourites,
          id: favDocId(me, lid),
          kind: 'upsert',
          tries: 0,
          payload: () => ({ userId: me, listingId: lid }),
          perms: () => docPermissions('owner', {}, me),
        });
      }
    }
    for (const lid of beforeMine) {
      if (!mine.includes(lid)) queue.push({ col: COL.favourites, id: favDocId(me, lid), kind: 'delete', tries: 0 });
    }
  }

  // conversations -> canonical docs + messages
  if (prev.conversations !== next.conversations) {
    const prevMap = new Map(prev.conversations.map((c) => [c.id, c]));
    for (const c of next.conversations) {
      const was = prevMap.get(c.id);
      if (was) {
        const changed =
          !sameDoc(was.messages.map((m) => m.id), c.messages.map((m) => m.id)) ||
          was.lastReadAt !== c.lastReadAt ||
          !!c.blocked !== !!was.blocked ||
          !!c.escrowChatUnlocked !== !!was.escrowChatUnlocked ||
          was.updatedAt !== c.updatedAt;
        if (!changed) continue;
      }
      enqueueConversation(c);
    }
  }

  schedule();
}

/** Push through anything pending right now (used after login / on reconnect). */
export async function flushSync() {
  await flush();
}

// ---------------------------------------------------------------------------
// first-run bootstrap: seed the shared marketplace when the cloud is empty
// ---------------------------------------------------------------------------
export async function bootstrapCloudSeed(db: DB, me: string): Promise<boolean> {
  if (!isCloudActive() || !databases) return false;
  try {
    const FLAG = 'dealmint_cloud_seeded_v1';
    if (localStorage.getItem(FLAG)) return false;
    const res = await databases.listDocuments(AW_DB, COL.listings, [Query.limit(1)]);
    if (res.total > 0) {
      localStorage.setItem(FLAG, '1');
      return false;
    }
    // NPC seller profiles (read-only, flagged via settings.npc)
    const npcIds = new Set<string>();
    for (const l of db.listings) {
      if (l.isDraft) continue;
      if (l.seller.id !== me && !npcIds.has(l.seller.id)) npcIds.add(l.seller.id);
    }
    for (const id of npcIds) {
      const fromListing = db.listings.find((l) => l.seller.id === id)?.seller;
      if (!fromListing) continue;
      const npc: StoredUser = { ...fromListing, password: '', settings: { ...(fromListing.settings as StoredUser['settings']), npc: true } as StoredUser['settings'] };
      await upsertDoc(COL.users, id, npcToDoc(npc), docPermissions(COL.users, npc, me));
    }
    // shared marketplace content
    for (const l of db.listings.filter((x) => !x.isDraft)) {
      await upsertDoc(COL.listings, l.id, listingToDoc(l), docPermissions(COL.listings, l, me));
    }
    for (const r of db.reviews) {
      await upsertDoc(COL.reviews, r.id, reviewToDoc(r), docPermissions(COL.reviews, r, me));
    }
    for (const sp of db.safeSpots) {
      await upsertDoc(COL.safeSpots, sp.id, spotToDoc(sp), docPermissions(COL.safeSpots, sp, me));
    }
    localStorage.setItem(FLAG, '1');
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// realtime
// ---------------------------------------------------------------------------
export type RealtimeHandler = (col: string, doc: Doc, events: string[]) => void;

export function subscribeRealtime(me: string | null, onDoc: RealtimeHandler): () => void {
  void me;
  if (!awClient || !isCloudActive()) return () => {};
  const cols: string[] = [
    COL.listings,
    COL.users,
    COL.orders,
    COL.conversations,
    COL.messages,
    COL.notifications,
    COL.reviews,
    COL.safeSpots,
    COL.transactions,
    COL.escrow,
  ];
  const unsubs = cols.map((col) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (awClient as any).subscribe(`databases.${AW_DB}.collections.${col}.documents`, (res: { payload: Doc; events: string[] }) => {
      onDoc(col, res.payload, res.events);
    })
  );
  return () => unsubs.forEach((u) => (typeof u === 'function' ? u() : undefined));
}

/** Merge one inbound realtime doc into the local mirror (pure). */
export function mergeRealtimeDoc(db: DB, col: string, doc: Doc, me: string | null): DB {
  if (!me) {
    if (col === COL.listings) {
      if (db.listings.some((l) => l.id === doc.$id)) return db;
      return { ...db, listings: [listingFromDoc(doc, new Map()), ...db.listings] };
    }
    if (col === COL.safeSpots) {
      return { ...db, safeSpots: [spotFromDoc(doc), ...db.safeSpots.filter((x) => x.id !== doc.$id)] };
    }
    return db;
  }

  const usersById = new Map(db.users.map((u) => [u.id, u]));

  switch (col) {
    case COL.listings: {
      const l = listingFromDoc(doc, usersById);
      return { ...db, listings: [l, ...db.listings.filter((x) => x.id !== l.id)] };
    }
    case COL.users: {
      const u = userFromDoc(doc);
      if (!db.users.some((x) => x.id === u.id) && u.id !== me && !isNpcUser(doc.settings)) return db;
      return { ...db, users: [u, ...db.users.filter((x) => x.id !== u.id)] };
    }
    case COL.messages: {
      const convId = s(doc.conversationId, 64);
      const msg = messageFromDoc(convId, doc);
      const idx = db.conversations.findIndex((c) => c.id === convId);
      if (idx === -1) return db;
      const convo = db.conversations[idx];
      if (convo.messages.some((m) => m.id === msg.id)) return db;
      const messages = [...convo.messages, msg].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const nextConvo: Conversation = { ...convo, messages, updatedAt: msg.createdAt > convo.updatedAt ? msg.createdAt : convo.updatedAt };
      const conversations = [...db.conversations];
      conversations[idx] = nextConvo;
      return { ...db, conversations };
    }
    case COL.conversations: {
      if (s(doc.userA, 64) !== me && s(doc.userB, 64) !== me) return db;
      convoCache.set(doc.$id, doc);
      const existing = db.conversations.find((c) => c.id === doc.$id);
      if (existing) {
        const view = convoViewFromDoc(doc, existing.messages, me, usersById);
        return { ...db, conversations: db.conversations.map((c) => (c.id === view.id ? view : c)) };
      }
      const view = convoViewFromDoc(doc, [], me, usersById);
      return { ...db, conversations: [view, ...db.conversations] };
    }
    case COL.orders: {
      if (s(doc.buyerId, 64) !== me && s(doc.sellerId, 64) !== me) return db;
      const o = orderFromDoc(doc);
      return { ...db, orders: [o, ...db.orders.filter((x) => x.id !== o.id)] };
    }
    case COL.notifications: {
      if (s(doc.userId, 64) !== me) return db;
      const nt = notifFromDoc(doc);
      return { ...db, notifications: [nt, ...db.notifications.filter((x) => x.id !== nt.id)] };
    }
    case COL.reviews: {
      const r = reviewFromDoc(doc);
      return { ...db, reviews: [r, ...db.reviews.filter((x) => x.id !== r.id)] };
    }
    case COL.safeSpots: {
      const sp = spotFromDoc(doc);
      return { ...db, safeSpots: [sp, ...db.safeSpots.filter((x) => x.id !== sp.id)] };
    }
    case COL.transactions: {
      if (s(doc.userId, 64) !== me) return db;
      const t = txFromDoc(doc);
      return { ...db, transactions: [t, ...db.transactions.filter((x) => x.id !== t.id)] };
    }
    case COL.escrow: {
      if (s(doc.buyerId, 64) !== me && s(doc.sellerId, 64) !== me) return db;
      const e = escrowFromDoc(doc);
      return { ...db, escrowLedger: [e, ...db.escrowLedger.filter((x) => x.id !== e.id)] };
    }
    default:
      return db;
  }
}

/** Which money-side reaction an inbound order transition implies for `me`. */
export function detectOrderTransition(
  prev: Order | undefined,
  next: Order,
  me: string
): 'refund-buyer' | 'payout-seller' | null {
  if (prev && prev.status === next.status) return null;
  if (next.status === 'cancelled' && next.buyerId === me && (!prev || prev.status !== 'cancelled')) return 'refund-buyer';
  if (next.status === 'completed' && next.sellerId === me && (!prev || prev.status !== 'completed')) return 'payout-seller';
  return null;
}

/** Strip cloud-internal ids when replacing the whole mirror after a pull. */
export function buildMergedDB(local: DB, remote: Partial<DB>, _me: string | null): DB {
  const keepLocal = <T extends { id: string }>(col: string, localItems: T[], serverItems: T[]): T[] => {
    const out = new Map<string, T>();
    for (const it of serverItems) out.set(it.id, it);
    for (const it of localItems) {
      if (!out.has(it.id) || !hasAcked(col, it.id)) out.set(it.id, it);
    }
    return [...out.values()];
  };

  const users = keepLocal(COL.users, local.users, remote.users || []);

  // conversations: canonical server views win per PAIR, local pending messages preserved
  const serverConvs = remote.conversations || [];
  const result: Conversation[] = [];
  const consumedPairs = new Set<string>();
  for (const sv of serverConvs) {
    const pair = convoDocId(sv.userId, sv.otherId);
    consumedPairs.add(pair);
    const localMatch =
      local.conversations.find((c) => convoDocId(c.userId, c.otherId) === pair && !hasAcked(COL.conversations, c.id)) ||
      local.conversations.find((c) => c.id === sv.id);
    if (localMatch && hasAcked(COL.conversations, sv.id)) {
      const msgs = dedupeById([...localMatch.messages, ...sv.messages]).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      result.push({
        ...sv,
        messages: msgs,
        lastReadAt: sv.lastReadAt > localMatch.lastReadAt ? sv.lastReadAt : localMatch.lastReadAt,
        blocked: sv.blocked || localMatch.blocked,
        escrowChatUnlocked: sv.escrowChatUnlocked || localMatch.escrowChatUnlocked,
        demoReplies: sv.demoReplies ?? localMatch.demoReplies,
      });
    } else {
      result.push(sv);
    }
  }
  for (const c of local.conversations) {
    const pair = convoDocId(c.userId, c.otherId);
    if (consumedPairs.has(pair)) continue;
    if (result.some((x) => convoDocId(x.userId, x.otherId) === pair)) continue;
    result.push(c);
  }
  result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const favourites: Record<string, string[]> = { ...local.favourites };
  if (remote.favourites) {
    for (const [uid2, ids] of Object.entries(remote.favourites)) {
      favourites[uid2] = [...new Set([...(favourites[uid2] || []), ...ids])];
    }
  }

  return {
    version: local.version,
    users,
    listings: keepLocal(COL.listings, local.listings, remote.listings || []),
    favourites,
    orders: keepLocal(COL.orders, local.orders, remote.orders || []),
    conversations: result,
    transactions: keepLocal(COL.transactions, local.transactions, remote.transactions || []),
    payoutAccounts: keepLocal(COL.payoutAccounts, local.payoutAccounts, remote.payoutAccounts || []),
    reviews: keepLocal(COL.reviews, local.reviews, remote.reviews || []),
    notifications: keepLocal(COL.notifications, local.notifications, remote.notifications || []),
    reports: local.reports,
    resetRequests: local.resetRequests,
    escrowLedger: keepLocal(COL.escrow, local.escrowLedger, remote.escrowLedger || []),
    savedSearches: keepLocal(COL.savedSearches, local.savedSearches, remote.savedSearches || []),
    priceAlerts: keepLocal(COL.priceAlerts, local.priceAlerts, remote.priceAlerts || []),
    safeSpots: keepLocal(COL.safeSpots, local.safeSpots, remote.safeSpots || []),
    referrals: keepLocal(COL.referrals, local.referrals, remote.referrals || []),
  } as DB;
}
