import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import type {
  Conversation,
  Listing,
  Message,
  Notification,
  Order,
  OrderStatus,
  PayoutAccount,
  Review,
  Transaction,
  User,
  UserSettings,
} from '@/types';
import { buildSeedDB, DB_VERSION, type DB, type StoredUser } from '@/data/seed';
import { featuredTaskers } from '@/data/mockData';
import { commissionRate } from '@/lib/categories';
import { uid } from '@/lib/format';

const DB_KEY = 'dealmint_db_v1';
const SESSION_KEY = 'dealmint_session_user';

// Demo "featured tasker" cards use t-ids; their listings belong to s-ids
const taskerAlias: Record<string, string> = { t1: 's1', t2: 's4', t3: 's3', t4: 's6' };
export const sellerRouteId = (taskerId: string) => taskerAlias[taskerId] || taskerId;

const cannedReplies = [
  'Thanks for reaching out! I am available and happy to help.',
  'Sure, can you share a few more details so I can give you an accurate timeline?',
  'Got it. I can start as soon as the order is placed.',
  'Sounds good. Feel free to place the order and I will get going right away.',
  'Absolutely. I will send an update shortly.',
];

function stripPassword(u: StoredUser): User {
  const { password: _pw, ...rest } = u;
  void _pw;
  return rest;
}

function loadDB(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DB;
      if (parsed.version === DB_VERSION) return parsed;
    }
  } catch {
    // fall through to a fresh seed
  }
  return buildSeedDB();
}

function loadSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'student' | 'general';
}

type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

interface AppContextValue {
  isLoading: boolean;
  user: User | null;

  // theme (per device)
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // auth
  login: (email: string, password: string, remember: boolean) => Result;
  register: (input: RegisterInput) => Result<User>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
  updateSettings: (patch: Partial<UserSettings>) => void;
  changePassword: (current: string, next: string) => Result;
  deleteAccount: () => void;
  requestPasswordReset: (email: string) => string | null;
  resetPassword: (email: string, code: string, next: string) => Result;
  verifyPhone: () => void;
  submitIdVerification: () => void;
  verifyStudent: (schoolEmail: string) => Result;

  // listings
  listings: Listing[];
  myListings: Listing[];
  getListing: (id: string | undefined) => Listing | undefined;
  getSeller: (id: string | undefined) => User | undefined;
  addListing: (data: Omit<Listing, 'id' | 'seller' | 'rating' | 'reviewCount' | 'completedOrders' | 'createdAt' | 'isFeatured' | 'isActive'> & { isActive?: boolean }) => Listing | null;
  updateListing: (id: string, patch: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
  recordView: (id: string) => void;
  reportListing: (listingId: string, reason: string, details: string) => void;

  // favourites
  favourites: string[];
  toggleFavourite: (id: string) => boolean;

  // reviews
  reviewsForListing: (id: string) => Review[];
  reviewsForSeller: (sellerId: string) => Review[];
  getListingStats: (l: Listing) => { rating: number; count: number };
  getSellerStats: (sellerId: string) => { rating: number; count: number };
  addReview: (orderId: string, rating: number, comment: string) => Result;
  replyToReview: (reviewId: string, reply: string) => void;

  // orders
  orders: Order[];
  createOrder: (listing: Listing, note: string, offer?: number) => Result<Order>;
  acceptOrder: (id: string) => void;
  declineOrder: (id: string) => void;
  deliverOrder: (id: string, note: string) => void;
  completeOrder: (id: string) => void;
  cancelOrder: (id: string) => void;
  disputeOrder: (id: string, reason: string) => void;
  withdrawDispute: (id: string) => void;
  simulateSeller: (id: string) => void;

  // messages
  conversations: Conversation[];
  unreadMessages: number;
  startConversation: (other: { id: string; name: string; avatar?: string }, listing?: Listing) => string | null;
  sendMessage: (conversationId: string, text: string, attachment?: { name: string; size: number }) => void;
  markConversationRead: (id: string) => void;
  toggleBlock: (id: string) => void;

  // wallet
  transactions: Transaction[];
  payoutAccounts: PayoutAccount[];
  deposit: (amount: number, method: string) => Result<Transaction>;
  withdraw: (amount: number, accountId: string) => Result<Transaction>;
  addPayoutAccount: (a: Omit<PayoutAccount, 'id' | 'userId'>) => PayoutAccount | null;
  removePayoutAccount: (id: string) => void;
  escrowHeld: number;

  // notifications
  notifications: Notification[];
  unreadNotifications: number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

const nowIso = () => new Date().toISOString();

export function AppProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => loadDB());
  const [sessionId, setSessionId] = useState<string | null>(() => loadSession());
  const [isLoading, setIsLoading] = useState(true);
  const dbRef = useRef(db);
  const warnedStorage = useRef(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const commit = useCallback((fn: (d: DB) => DB) => {
    const next = fn(dbRef.current);
    dbRef.current = next;
    setDb(next);
  }, []);

  // Persist
  useEffect(() => {
    dbRef.current = db;
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      if (!warnedStorage.current) {
        warnedStorage.current = true;
        toast.error('Browser storage is full. Some changes may not be saved.');
      }
    }
  }, [db]);

  // Keep several tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DB_KEY && e.newValue) {
        try {
          const next = JSON.parse(e.newValue) as DB;
          dbRef.current = next;
          setDb(next);
        } catch {
          // ignore bad payloads
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const storedUser = useMemo(
    () => (sessionId ? db.users.find((u) => u.id === sessionId) || null : null),
    [db.users, sessionId]
  );
  const user = useMemo(() => (storedUser ? stripPassword(storedUser) : null), [storedUser]);
  const uidNow = () => sessionId; // current user id at call time

  // ---------- theme ----------
  // Logged-in users: theme is bound to the account record, so it follows the account.
  // Visitors: follow the device system preference (live).
  const [systemDark, setSystemDark] = useState<boolean>(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );
  const [guestDark, setGuestDark] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // One-time migration: legacy per-device choice -> account preference
  useEffect(() => {
    if (!user || user.theme !== undefined) return;
    const stored = localStorage.getItem('dealmint_darkmode');
    const theme: 'light' | 'dark' = stored !== null ? (stored === 'true' ? 'dark' : 'light') : systemDark ? 'dark' : 'light';
    commit((d) => ({ ...d, users: d.users.map((u) => (u.id === user.id ? { ...u, theme } : u)) }));
  }, [user, systemDark, commit]);

  const isDarkMode = user
    ? user.theme !== undefined
      ? user.theme === 'dark'
      : systemDark
    : guestDark ?? systemDark;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    if (!user) {
      setGuestDark((v) => !(v ?? systemDark));
      return;
    }
    const next: 'light' | 'dark' = (user.theme ?? (systemDark ? 'dark' : 'light')) === 'dark' ? 'light' : 'dark';
    commit((d) => ({
      ...d,
      users: d.users.map((u) => (u.id === user.id ? { ...u, theme: next } : u)),
    }));
    localStorage.setItem('dealmint_darkmode', String(next === 'dark')); // legacy per-device cache
  }, [user, systemDark, commit]);

  // ---------- helpers that run on a db snapshot ----------
  const pushNotification = (d: DB, userId: string, n: Omit<Notification, 'id' | 'userId' | 'isRead' | 'createdAt'>): DB => {
    // Only real accounts get notifications
    if (!d.users.some((u) => u.id === userId)) return d;
    return {
      ...d,
      notifications: [
        { id: uid('n'), userId, isRead: false, createdAt: nowIso(), ...n },
        ...d.notifications,
      ],
    };
  };

  const adjustBalance = (d: DB, userId: string, delta: number): DB => {
    if (!d.users.some((u) => u.id === userId)) return d;
    return {
      ...d,
      users: d.users.map((u) => (u.id === userId ? { ...u, walletBalance: Math.max(0, u.walletBalance + delta) } : u)),
    };
  };

  const addTx = (d: DB, tx: Omit<Transaction, 'id' | 'createdAt' | 'status'> & { status?: Transaction['status'] }): DB => {
    if (!d.users.some((u) => u.id === tx.userId)) return d;
    return {
      ...d,
      transactions: [
        { id: uid('t'), createdAt: nowIso(), status: 'completed', reference: 'DM-' + Math.random().toString(36).slice(2, 8).toUpperCase(), ...tx },
        ...d.transactions,
      ],
    };
  };

  // ---------- auth ----------
  const login: AppContextValue['login'] = (email, password, remember) => {
    const found = dbRef.current.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return { ok: false, error: 'No account found with that email address.' };
    if (found.password !== password) return { ok: false, error: 'Incorrect password. Please try again.' };
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, found.id);
    } catch {
      // storage unavailable, keep in memory only
    }
    setSessionId(found.id);
    return { ok: true };
  };

  const register: AppContextValue['register'] = (input) => {
    const email = input.email.trim().toLowerCase();
    if (dbRef.current.users.some((u) => u.email.toLowerCase() === email)) {
      return { ok: false, error: 'An account with this email already exists. Try signing in instead.' };
    }
    const newUser: StoredUser = {
      id: uid('u'),
      name: input.name.trim(),
      email,
      password: input.password,
      phone: input.phone.trim(),
      role: input.role,
      isVerified: false,
      phoneVerified: false,
      idVerified: false,
      idStatus: 'none',
      studentVerified: false,
      rating: 0,
      reviewCount: 0,
      avatar: '/images/avatar_default.jpg',
      joinedAt: nowIso(),
      walletBalance: 0,
      skills: [],
      settings: {
        emailNotifications: true,
        orderUpdates: true,
        messageAlerts: true,
        marketing: false,
        showPhone: false,
        showLocation: true,
      },
    };
    commit((d) =>
      pushNotification(
        { ...d, users: [...d.users, newUser] },
        newUser.id,
        { type: 'system', title: 'Welcome to Dealmint', message: 'Verify your phone number to unlock ordering and posting.', link: '/verify-phone' }
      )
    );
    try {
      sessionStorage.removeItem(SESSION_KEY);
      localStorage.setItem(SESSION_KEY, newUser.id);
    } catch {
      // ignore
    }
    setSessionId(newUser.id);
    return { ok: true, data: stripPassword(newUser) };
  };

  const logout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setSessionId(null);
  };

  const updateProfile: AppContextValue['updateProfile'] = (patch) => {
    const id = uidNow();
    if (!id) return;
    commit((d) => {
      const users = d.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
      const me = users.find((u) => u.id === id)!;
      const snapshot = stripPassword(me);
      return {
        ...d,
        users,
        listings: d.listings.map((l) => (l.seller.id === id ? { ...l, seller: snapshot } : l)),
      };
    });
  };

  const updateSettings: AppContextValue['updateSettings'] = (patch) => {
    if (!storedUser) return;
    updateProfile({ settings: { ...(storedUser.settings as UserSettings), ...patch } });
  };

  const changePassword: AppContextValue['changePassword'] = (current, next) => {
    if (!storedUser) return { ok: false, error: 'You need to be signed in.' };
    if (storedUser.password !== current) return { ok: false, error: 'Your current password is incorrect.' };
    if (current === next) return { ok: false, error: 'Choose a password you have not used before.' };
    commit((d) => ({ ...d, users: d.users.map((u) => (u.id === storedUser.id ? { ...u, password: next } : u)) }));
    return { ok: true };
  };

  const deleteAccount = () => {
    const id = uidNow();
    if (!id) return;
    commit((d) => ({
      ...d,
      users: d.users.filter((u) => u.id !== id),
      listings: d.listings.filter((l) => l.seller.id !== id),
      favourites: Object.fromEntries(Object.entries(d.favourites).filter(([k]) => k !== id)),
      conversations: d.conversations.filter((c) => c.userId !== id),
      transactions: d.transactions.filter((t) => t.userId !== id),
      payoutAccounts: d.payoutAccounts.filter((p) => p.userId !== id),
      notifications: d.notifications.filter((n) => n.userId !== id),
    }));
    logout();
  };

  const requestPasswordReset: AppContextValue['requestPasswordReset'] = (email) => {
    const found = dbRef.current.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) return null;
    const code = String(Math.floor(100000 + Math.random() * 900000));
    commit((d) => ({
      ...d,
      resetRequests: [
        ...d.resetRequests.filter((r) => r.email !== found.email),
        { email: found.email, code, createdAt: nowIso() },
      ],
    }));
    return code;
  };

  const resetPassword: AppContextValue['resetPassword'] = (email, code, next) => {
    const req = dbRef.current.resetRequests.find((r) => r.email.toLowerCase() === email.trim().toLowerCase());
    if (!req) return { ok: false, error: 'Request a new reset code first.' };
    if (Date.now() - new Date(req.createdAt).getTime() > 15 * 60000) return { ok: false, error: 'That code has expired. Request a new one.' };
    if (req.code !== code) return { ok: false, error: 'That code is not correct.' };
    commit((d) => ({
      ...d,
      users: d.users.map((u) => (u.email.toLowerCase() === req.email.toLowerCase() ? { ...u, password: next } : u)),
      resetRequests: d.resetRequests.filter((r) => r.email !== req.email),
    }));
    return { ok: true };
  };

  const verifyPhone = () => {
    updateProfile({ phoneVerified: true, isVerified: true });
    const id = uidNow();
    if (id) commit((d) => pushNotification(d, id, { type: 'system', title: 'Phone verified', message: 'Your phone number is now verified.' }));
  };

  const submitIdVerification = () => {
    const id = uidNow();
    if (!id) return;
    updateProfile({ idStatus: 'pending' });
    commit((d) => pushNotification(d, id, { type: 'system', title: 'ID submitted', message: 'We are reviewing your ID. This usually takes a moment.' }));
    // Simulated review
    setTimeout(() => {
      commit((d) => {
        if (!d.users.some((u) => u.id === id)) return d;
        const users = d.users.map((u) => (u.id === id ? { ...u, idStatus: 'verified' as const, idVerified: true } : u));
        const snapshot = stripPassword(users.find((u) => u.id === id)!);
        return pushNotification(
          { ...d, users, listings: d.listings.map((l) => (l.seller.id === id ? { ...l, seller: snapshot } : l)) },
          id,
          { type: 'system', title: 'ID verified', message: 'You now have the verified ID badge.' }
        );
      });
    }, 3500);
  };

  const verifyStudent: AppContextValue['verifyStudent'] = (schoolEmail) => {
    const e = schoolEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.(edu\.ng|edu)$/.test(e)) {
      return { ok: false, error: 'Use your school email ending in .edu.ng or .edu.' };
    }
    updateProfile({ role: 'student', studentVerified: true });
    return { ok: true };
  };

  // ---------- listings ----------
  const visibleListings = useMemo(
    () => db.listings.filter((l) => l.isActive && !l.isDraft),
    [db.listings]
  );
  const myListings = useMemo(
    () => (sessionId ? db.listings.filter((l) => l.seller.id === sessionId) : []),
    [db.listings, sessionId]
  );

  const getListing = (id: string | undefined) => db.listings.find((l) => l.id === id);

  const getSeller = (id: string | undefined): User | undefined => {
    if (!id) return undefined;
    const rid = taskerAlias[id] || id;
    const real = db.users.find((u) => u.id === rid);
    if (real) return stripPassword(real);
    const fromListing = db.listings.find((l) => l.seller.id === rid)?.seller;
    if (!fromListing) return undefined;
    const tasker = featuredTaskers.find((t) => taskerAlias[t.id] === rid);
    return tasker
      ? { ...fromListing, bio: tasker.bio, skills: tasker.skills, location: tasker.location }
      : fromListing;
  };

  const addListing: AppContextValue['addListing'] = (data) => {
    if (!user) return null;
    const listing: Listing = {
      ...data,
      id: uid('l'),
      seller: user,
      rating: 0,
      reviewCount: 0,
      completedOrders: 0,
      createdAt: nowIso(),
      isFeatured: false,
      isActive: data.isActive ?? true,
      views: 0,
    };
    commit((d) => ({ ...d, listings: [listing, ...d.listings] }));
    return listing;
  };

  const updateListing: AppContextValue['updateListing'] = (id, patch) => {
    commit((d) => ({ ...d, listings: d.listings.map((l) => (l.id === id ? { ...l, ...patch } : l)) }));
  };

  const deleteListing: AppContextValue['deleteListing'] = (id) => {
    commit((d) => ({
      ...d,
      listings: d.listings.filter((l) => l.id !== id),
      favourites: Object.fromEntries(Object.entries(d.favourites).map(([k, v]) => [k, v.filter((x) => x !== id)])),
    }));
  };

  const recordView = (id: string) => {
    commit((d) => ({
      ...d,
      listings: d.listings.map((l) => (l.id === id && l.seller.id !== sessionId ? { ...l, views: (l.views || 0) + 1 } : l)),
    }));
  };

  const reportListing: AppContextValue['reportListing'] = (listingId, reason, details) => {
    commit((d) => ({
      ...d,
      reports: [...d.reports, { id: uid('rp'), listingId, reason, details, reporterId: sessionId || 'guest', createdAt: nowIso() }],
    }));
  };

  // ---------- favourites ----------
  const favourites = useMemo(() => (sessionId ? db.favourites[sessionId] || [] : []), [db.favourites, sessionId]);
  const toggleFavourite = (id: string) => {
    if (!sessionId) return false;
    let added = false;
    commit((d) => {
      const cur = d.favourites[sessionId] || [];
      added = !cur.includes(id);
      return { ...d, favourites: { ...d.favourites, [sessionId]: added ? [...cur, id] : cur.filter((x) => x !== id) } };
    });
    return added;
  };

  // ---------- reviews ----------
  const reviewsForListing = (id: string) =>
    db.reviews.filter((r) => r.listingId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const reviewsForSeller = (sellerId: string) => {
    const rid = taskerAlias[sellerId] || sellerId;
    return db.reviews.filter((r) => r.sellerId === rid).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };

  const calcStats = (baseRating: number, baseCount: number, extra: Review[]) => {
    const count = baseCount + extra.length;
    if (count === 0) return { rating: 0, count: 0 };
    const total = baseRating * baseCount + extra.reduce((s, r) => s + r.rating, 0);
    return { rating: Math.round((total / count) * 10) / 10, count };
  };
  const getListingStats = (l: Listing) =>
    calcStats(l.rating, l.reviewCount, db.reviews.filter((r) => r.listingId === l.id && r.id.startsWith('rv_')));
  const getSellerStats = (sellerId: string) => {
    const s = getSeller(sellerId);
    const rid = taskerAlias[sellerId] || sellerId;
    return calcStats(s?.rating || 0, s?.reviewCount || 0, db.reviews.filter((r) => r.sellerId === rid && r.id.startsWith('rv_')));
  };

  const addReview: AppContextValue['addReview'] = (orderId, rating, comment) => {
    const order = dbRef.current.orders.find((o) => o.id === orderId);
    if (!user || !order) return { ok: false, error: 'Order not found.' };
    if (order.buyerId !== user.id) return { ok: false, error: 'Only the buyer can review this order.' };
    if (order.status !== 'completed') return { ok: false, error: 'You can review an order once it is completed.' };
    if (order.reviewed) return { ok: false, error: 'You already reviewed this order.' };
    const review: Review = {
      id: uid('rv'),
      listingId: order.listingId,
      sellerId: order.sellerId,
      orderId,
      reviewerId: user.id,
      reviewerName: user.name,
      reviewerAvatar: user.avatar,
      rating,
      comment: comment.trim(),
      createdAt: nowIso(),
    };
    commit((d) =>
      pushNotification(
        {
          ...d,
          reviews: [review, ...d.reviews],
          orders: d.orders.map((o) => (o.id === orderId ? { ...o, reviewed: true } : o)),
        },
        order.sellerId,
        { type: 'review', title: `New ${rating}-star review`, message: `${user.name} reviewed "${order.listingTitle}".`, link: '/dashboard/reviews' }
      )
    );
    return { ok: true };
  };

  const replyToReview: AppContextValue['replyToReview'] = (reviewId, reply) => {
    commit((d) => ({ ...d, reviews: d.reviews.map((r) => (r.id === reviewId ? { ...r, reply: reply.trim() } : r)) }));
  };

  // ---------- orders ----------
  const orders = useMemo(
    () =>
      sessionId
        ? db.orders
            .filter((o) => o.buyerId === sessionId || o.sellerId === sessionId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [],
    [db.orders, sessionId]
  );

  const transition = (d: DB, id: string, status: OrderStatus, note?: string, extra: Partial<Order> = {}): DB => ({
    ...d,
    orders: d.orders.map((o) =>
      o.id === id
        ? { ...o, ...extra, status, timeline: [...o.timeline, { status, at: nowIso(), note }] }
        : o
    ),
  });

  const refund = (d: DB, o: Order, description: string): DB => {
    let next = adjustBalance(d, o.buyerId, o.price);
    next = addTx(next, { userId: o.buyerId, type: 'refund', amount: o.price, description, orderId: o.id });
    return next;
  };

  const payout = (d: DB, o: Order): DB => {
    const net = o.price - o.fee;
    let next = adjustBalance(d, o.sellerId, net);
    next = addTx(next, { userId: o.sellerId, type: 'earning', amount: net, fee: o.fee, description: `Payment for ${o.listingTitle}`, orderId: o.id });
    return next;
  };

  const createOrder: AppContextValue['createOrder'] = (listing, note, offer) => {
    const d0 = dbRef.current;
    const me = d0.users.find((u) => u.id === sessionId);
    if (!me) return { ok: false, error: 'Please sign in to continue.' };
    if (listing.seller.id === me.id) return { ok: false, error: 'You cannot order your own listing.' };
    if (!listing.isActive) return { ok: false, error: 'This listing is not available right now.' };
    const price = Math.round(offer && offer > 0 ? offer : listing.price);
    if (!Number.isFinite(price) || price < 100) return { ok: false, error: 'Enter a valid amount of at least ₦100.' };
    if (me.walletBalance < price) {
      return { ok: false, error: `Your wallet balance is too low. You need ₦${price.toLocaleString()} to pay into escrow.` };
    }
    const sellerAccount = d0.users.find((u) => u.id === listing.seller.id);
    const rate = commissionRate(sellerAccount?.role || listing.seller.role);
    const instant = listing.type === 'digital';
    const order: Order = {
      id: uid('o'),
      listingId: listing.id,
      listingTitle: listing.title,
      listingType: listing.type,
      listingImage: listing.images[0],
      buyerId: me.id,
      buyerName: me.name,
      buyerAvatar: me.avatar,
      sellerId: listing.seller.id,
      sellerName: listing.seller.name,
      sellerAvatar: listing.seller.avatar,
      status: instant ? 'completed' : 'pending',
      price,
      fee: Math.round(price * rate),
      note: note.trim() || undefined,
      createdAt: nowIso(),
      completedAt: instant ? nowIso() : undefined,
      demoSeller: !sellerAccount,
      timeline: instant
        ? [
            { status: 'pending', at: nowIso() },
            { status: 'completed', at: nowIso(), note: 'Digital product delivered instantly.' },
          ]
        : [{ status: 'pending', at: nowIso() }],
    };
    commit((d) => {
      let next = adjustBalance(d, me.id, -price);
      next = addTx(next, { userId: me.id, type: 'payment', amount: -price, description: `Payment for ${listing.title}`, orderId: order.id });
      next = { ...next, orders: [order, ...next.orders] };
      if (instant) next = payout(next, order);
      next = {
        ...next,
        listings: next.listings.map((l) => (l.id === listing.id ? { ...l, completedOrders: l.completedOrders + (instant ? 1 : 0) } : l)),
      };
      const verb = listing.type === 'job' ? 'applied for' : listing.type === 'task' ? 'made an offer on' : 'ordered';
      return pushNotification(next, listing.seller.id, {
        type: 'order',
        title: instant ? 'Digital product sold' : 'New order received',
        message: `${me.name} ${verb} "${listing.title}".`,
        link: `/dashboard/orders/${order.id}`,
      });
    });
    return { ok: true, data: order };
  };

  const getOrder = (id: string) => dbRef.current.orders.find((o) => o.id === id);

  const acceptOrder = (id: string) => {
    const o = getOrder(id);
    if (!o || o.status !== 'pending' || o.sellerId !== sessionId) return;
    commit((d) =>
      pushNotification(transition(d, id, 'in_progress'), o.buyerId, {
        type: 'order', title: 'Order accepted', message: `${o.sellerName} started working on "${o.listingTitle}".`, link: `/dashboard/orders/${id}`,
      })
    );
  };

  const declineOrder = (id: string) => {
    const o = getOrder(id);
    if (!o || o.status !== 'pending' || o.sellerId !== sessionId) return;
    commit((d) =>
      pushNotification(
        refund(transition(d, id, 'cancelled', 'Declined by seller'), o, `Refund for ${o.listingTitle}`),
        o.buyerId,
        { type: 'order', title: 'Order declined', message: `${o.sellerName} could not take "${o.listingTitle}". You were refunded.`, link: `/dashboard/orders/${id}` }
      )
    );
  };

  const deliverOrder = (id: string, note: string) => {
    const o = getOrder(id);
    if (!o || o.status !== 'in_progress' || o.sellerId !== sessionId) return;
    commit((d) =>
      pushNotification(transition(d, id, 'delivered', note, { deliveryNote: note }), o.buyerId, {
        type: 'order', title: 'Order delivered', message: `"${o.listingTitle}" is ready for your review.`, link: `/dashboard/orders/${id}`,
      })
    );
  };

  const completeOrder = (id: string) => {
    const o = getOrder(id);
    if (!o || (o.status !== 'delivered') || o.buyerId !== sessionId) return;
    commit((d) => {
      let next = transition(d, id, 'completed', undefined, { completedAt: nowIso() });
      next = payout(next, o);
      next = {
        ...next,
        listings: next.listings.map((l) => (l.id === o.listingId ? { ...l, completedOrders: l.completedOrders + 1 } : l)),
      };
      return pushNotification(next, o.sellerId, {
        type: 'payment', title: 'Payment released', message: `You earned ₦${(o.price - o.fee).toLocaleString()} for "${o.listingTitle}".`, link: '/dashboard/wallet',
      });
    });
  };

  const cancelOrder = (id: string) => {
    const o = getOrder(id);
    if (!o) return;
    const isBuyer = o.buyerId === sessionId;
    const isSeller = o.sellerId === sessionId;
    const allowed = (isBuyer && o.status === 'pending') || (isSeller && o.status === 'in_progress');
    if (!allowed) return;
    commit((d) =>
      pushNotification(
        refund(transition(d, id, 'cancelled', isBuyer ? 'Cancelled by buyer' : 'Cancelled by seller'), o, `Refund for ${o.listingTitle}`),
        isBuyer ? o.sellerId : o.buyerId,
        { type: 'order', title: 'Order cancelled', message: `"${o.listingTitle}" was cancelled.`, link: `/dashboard/orders/${id}` }
      )
    );
  };

  const disputeOrder = (id: string, reason: string) => {
    const o = getOrder(id);
    if (!o || o.buyerId !== sessionId || !['in_progress', 'delivered'].includes(o.status)) return;
    commit((d) =>
      pushNotification(transition(d, id, 'disputed', reason), o.sellerId, {
        type: 'order', title: 'Dispute opened', message: `${o.buyerName} opened a dispute on "${o.listingTitle}".`, link: `/dashboard/orders/${id}`,
      })
    );
  };

  const withdrawDispute = (id: string) => {
    const o = getOrder(id);
    if (!o || o.buyerId !== sessionId || o.status !== 'disputed') return;
    const before = [...o.timeline].reverse().find((e) => e.status !== 'disputed')?.status || 'in_progress';
    commit((d) => transition(d, id, before === 'delivered' ? 'delivered' : 'in_progress', 'Dispute withdrawn'));
  };

  // Lets a person try the full order flow when the seller is a demo account
  const simulateSeller = (id: string) => {
    const o = getOrder(id);
    if (!o || !o.demoSeller || o.buyerId !== sessionId) return;
    if (o.status === 'pending') {
      commit((d) => transition(d, id, 'in_progress'));
    } else if (o.status === 'in_progress') {
      const note = 'Work complete. Files and instructions have been sent over. Let me know if you need any tweaks.';
      commit((d) => transition(d, id, 'delivered', note, { deliveryNote: note }));
    }
  };

  // ---------- messages ----------
  const conversations = useMemo(
    () =>
      sessionId
        ? db.conversations.filter((c) => c.userId === sessionId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        : [],
    [db.conversations, sessionId]
  );
  const unreadMessages = useMemo(
    () =>
      conversations.reduce(
        (sum, c) => sum + c.messages.filter((m) => m.senderId !== sessionId && m.createdAt > c.lastReadAt).length,
        0
      ),
    [conversations, sessionId]
  );

  const startConversation: AppContextValue['startConversation'] = (other, listing) => {
    if (!sessionId) return null;
    if (other.id === sessionId) return null;
    const rid = taskerAlias[other.id] || other.id;
    const existing = dbRef.current.conversations.find((c) => c.userId === sessionId && c.otherId === rid);
    if (existing) return existing.id;
    const isReal = dbRef.current.users.some((u) => u.id === rid);
    const convo: Conversation = {
      id: uid('c'),
      userId: sessionId,
      otherId: rid,
      otherName: other.name,
      otherAvatar: other.avatar,
      listingId: listing?.id,
      listingTitle: listing?.title,
      messages: [],
      lastReadAt: nowIso(),
      updatedAt: nowIso(),
      demoReplies: !isReal,
    };
    commit((d) => ({ ...d, conversations: [convo, ...d.conversations] }));
    return convo.id;
  };

  const sendMessage: AppContextValue['sendMessage'] = (conversationId, text, attachment) => {
    const me = sessionId;
    const convo = dbRef.current.conversations.find((c) => c.id === conversationId);
    if (!me || !convo || convo.blocked) return;
    const clean = text.trim();
    if (!clean && !attachment) return;
    const msg: Message = { id: uid('m'), senderId: me, content: clean, createdAt: nowIso(), attachment };
    commit((d) => {
      let next: DB = {
        ...d,
        conversations: d.conversations.map((c) =>
          c.id === conversationId ? { ...c, messages: [...c.messages, msg], updatedAt: msg.createdAt, lastReadAt: msg.createdAt } : c
        ),
      };
      // Mirror into the other person's inbox if they are a real account
      if (next.users.some((u) => u.id === convo.otherId)) {
        const mine = next.users.find((u) => u.id === me)!;
        const theirs = next.conversations.find((c) => c.userId === convo.otherId && c.otherId === me);
        if (theirs) {
          next = {
            ...next,
            conversations: next.conversations.map((c) =>
              c.id === theirs.id ? { ...c, messages: [...c.messages, msg], updatedAt: msg.createdAt } : c
            ),
          };
        } else {
          next = {
            ...next,
            conversations: [
              {
                id: uid('c'),
                userId: convo.otherId,
                otherId: me,
                otherName: mine.name,
                otherAvatar: mine.avatar,
                listingId: convo.listingId,
                listingTitle: convo.listingTitle,
                messages: [msg],
                lastReadAt: new Date(Date.parse(msg.createdAt) - 1).toISOString(),
                updatedAt: msg.createdAt,
              },
              ...next.conversations,
            ],
          };
        }
        next = pushNotification(next, convo.otherId, {
          type: 'message', title: `New message from ${mine.name}`, message: clean || 'Sent an attachment', link: '/dashboard/messages',
        });
      }
      return next;
    });

    if (convo.demoReplies) {
      const reply = cannedReplies[Math.floor(Math.random() * cannedReplies.length)];
      setTimeout(() => {
        commit((d) => {
          const c = d.conversations.find((x) => x.id === conversationId);
          if (!c || c.blocked) return d;
          const at = nowIso();
          const next: DB = {
            ...d,
            conversations: d.conversations.map((x) =>
              x.id === conversationId
                ? { ...x, messages: [...x.messages, { id: uid('m'), senderId: x.otherId, content: reply, createdAt: at }], updatedAt: at }
                : x
            ),
          };
          return pushNotification(next, me, {
            type: 'message', title: `New message from ${c.otherName}`, message: reply, link: '/dashboard/messages',
          });
        });
      }, 1800);
    }
  };

  const markConversationRead = (id: string) => {
    const c = dbRef.current.conversations.find((x) => x.id === id);
    if (!c) return;
    const last = c.messages[c.messages.length - 1];
    if (!last || last.createdAt <= c.lastReadAt) return;
    commit((d) => ({
      ...d,
      conversations: d.conversations.map((x) => (x.id === id ? { ...x, lastReadAt: nowIso() } : x)),
    }));
  };

  const toggleBlock = (id: string) => {
    commit((d) => ({ ...d, conversations: d.conversations.map((c) => (c.id === id ? { ...c, blocked: !c.blocked } : c)) }));
  };

  // ---------- wallet ----------
  const transactions = useMemo(
    () => (sessionId ? db.transactions.filter((t) => t.userId === sessionId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [db.transactions, sessionId]
  );
  const payoutAccounts = useMemo(
    () => (sessionId ? db.payoutAccounts.filter((p) => p.userId === sessionId) : []),
    [db.payoutAccounts, sessionId]
  );
  const escrowHeld = useMemo(
    () =>
      sessionId
        ? db.orders
            .filter((o) => o.buyerId === sessionId && ['pending', 'in_progress', 'delivered', 'disputed'].includes(o.status))
            .reduce((s, o) => s + o.price, 0)
        : 0,
    [db.orders, sessionId]
  );

  const deposit: AppContextValue['deposit'] = (amount, method) => {
    if (!sessionId) return { ok: false, error: 'Please sign in first.' };
    if (!Number.isFinite(amount) || amount < 500) return { ok: false, error: 'The minimum deposit is ₦500.' };
    if (amount > 5000000) return { ok: false, error: 'The maximum deposit is ₦5,000,000.' };
    let tx!: Transaction;
    commit((d) => {
      let next = adjustBalance(d, sessionId, amount);
      next = addTx(next, { userId: sessionId, type: 'deposit', amount, description: `Wallet deposit via ${method}` });
      tx = next.transactions[0];
      return next;
    });
    return { ok: true, data: tx };
  };

  const withdraw: AppContextValue['withdraw'] = (amount, accountId) => {
    const me = dbRef.current.users.find((u) => u.id === sessionId);
    if (!me) return { ok: false, error: 'Please sign in first.' };
    const acct = dbRef.current.payoutAccounts.find((p) => p.id === accountId && p.userId === me.id);
    if (!acct) return { ok: false, error: 'Choose a payout account.' };
    if (!Number.isFinite(amount) || amount < 1000) return { ok: false, error: 'The minimum withdrawal is ₦1,000.' };
    if (amount > me.walletBalance) return { ok: false, error: 'You cannot withdraw more than your available balance.' };
    let tx!: Transaction;
    commit((d) => {
      let next = adjustBalance(d, me.id, -amount);
      next = addTx(next, { userId: me.id, type: 'withdrawal', amount: -amount, description: `Withdrawal to ${acct.bankName} ••${acct.accountNumber.slice(-4)}` });
      tx = next.transactions[0];
      return next;
    });
    return { ok: true, data: tx };
  };

  const addPayoutAccount: AppContextValue['addPayoutAccount'] = (a) => {
    if (!sessionId) return null;
    const acct: PayoutAccount = { ...a, id: uid('pa'), userId: sessionId };
    commit((d) => ({ ...d, payoutAccounts: [...d.payoutAccounts, acct] }));
    return acct;
  };

  const removePayoutAccount: AppContextValue['removePayoutAccount'] = (id) => {
    commit((d) => ({ ...d, payoutAccounts: d.payoutAccounts.filter((p) => p.id !== id) }));
  };

  // ---------- notifications ----------
  const notifications = useMemo(
    () => (sessionId ? db.notifications.filter((n) => n.userId === sessionId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : []),
    [db.notifications, sessionId]
  );
  const unreadNotifications = notifications.filter((n) => !n.isRead).length;
  const markNotificationRead = (id: string) =>
    commit((d) => ({ ...d, notifications: d.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }));
  const markAllNotificationsRead = () =>
    commit((d) => ({ ...d, notifications: d.notifications.map((n) => (n.userId === sessionId ? { ...n, isRead: true } : n)) }));
  const clearNotifications = () =>
    commit((d) => ({ ...d, notifications: d.notifications.filter((n) => n.userId !== sessionId) }));

  const value: AppContextValue = {
    isLoading,
    isDarkMode,
    toggleDarkMode,
    user,
    login,
    register,
    logout,
    updateProfile,
    updateSettings,
    changePassword,
    deleteAccount,
    requestPasswordReset,
    resetPassword,
    verifyPhone,
    submitIdVerification,
    verifyStudent,
    listings: visibleListings,
    myListings,
    getListing,
    getSeller,
    addListing,
    updateListing,
    deleteListing,
    recordView,
    reportListing,
    favourites,
    toggleFavourite,
    reviewsForListing,
    reviewsForSeller,
    getListingStats,
    getSellerStats,
    addReview,
    replyToReview,
    orders,
    createOrder,
    acceptOrder,
    declineOrder,
    deliverOrder,
    completeOrder,
    cancelOrder,
    disputeOrder,
    withdrawDispute,
    simulateSeller,
    conversations,
    unreadMessages,
    startConversation,
    sendMessage,
    markConversationRead,
    toggleBlock,
    transactions,
    payoutAccounts,
    deposit,
    withdraw,
    addPayoutAccount,
    removePayoutAccount,
    escrowHeld,
    notifications,
    unreadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
