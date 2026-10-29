// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'general' | 'admin';
  isVerified: boolean;
  phoneVerified: boolean;
  idVerified: boolean;
  rating: number;
  reviewCount: number;
  location?: string;
  bio?: string;
  skills?: string[];
  joinedAt: string;
  walletBalance: number;
  phone?: string;
  website?: string;
  idStatus?: 'none' | 'pending' | 'verified';
  idDocType?: string;
  studentVerified?: boolean;
  settings?: UserSettings;
  theme?: 'light' | 'dark';
}

export interface UserSettings {
  emailNotifications: boolean;
  orderUpdates: boolean;
  messageAlerts: boolean;
  marketing: boolean;
  showPhone: boolean;
  showLocation: boolean;
}

// Listing Types
export type ListingType = 'gig' | 'task' | 'job' | 'service' | 'digital';

export interface Listing {
  id: string;
  title: string;
  description: string;
  type: ListingType;
  category: string;
  subcategory?: string;
  price: number;
  priceType: 'fixed' | 'hourly' | 'negotiable';
  location?: string;
  isRemote: boolean;
  images: string[];
  seller: User;
  rating: number;
  reviewCount: number;
  completedOrders: number;
  tags: string[];
  createdAt: string;
  isFeatured: boolean;
  isUrgent?: boolean;
  isActive: boolean;
  isDraft?: boolean;
  views?: number;
  deliveryTime?: string;
  requirements?: string;
  salaryType?: string;
  deadline?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

// Category Types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  image: string;
  listingCount: number;
  subcategories: string[];
}

// Review Types
export interface Review {
  id: string;
  listingId: string;
  sellerId: string;
  orderId?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  attachment?: { name: string; size: number };
}

export interface Conversation {
  id: string;
  // The signed-in user's id and the person they are talking to
  userId: string;
  otherId: string;
  otherName: string;
  otherAvatar?: string;
  listingId?: string;
  listingTitle?: string;
  messages: Message[];
  lastReadAt: string;
  updatedAt: string;
  blocked?: boolean;
  demoReplies?: boolean;
  // Escrow-gated chat: the request recipient can waive the lock and reply anyway
  escrowChatUnlocked?: boolean;
}

// Wallet Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund' | 'bonus' | 'escrow_fund' | 'platform_fee' | 'referral_bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
  reference?: string;
  orderId?: string;
  fee?: number;
}

// Escrow ledger: one record per order that has (or had) money held
export interface EscrowRecord {
  id: string;
  orderId: string;
  listingTitle: string;
  amount: number;
  buyerId: string;
  sellerId: string;
  status: 'funded' | 'released' | 'refunded' | 'disputed';
  fundedAt: string;
  autoReleaseAt: string;
  releasedAt?: string;
  commission: number;
  payout: number;
}

// Saved searches & price alerts
export interface SavedSearch {
  id: string;
  userId: string;
  label: string;
  query: string;
  type: string;
  category: string;
  where: string;
  price: string;
  frequency: 'instant' | 'daily' | 'weekly';
  // match count when the search was last run; -1 = never computed
  baseline: number;
  createdAt: string;
  active: boolean;
}

export interface PriceAlert {
  id: string;
  userId: string;
  listingId: string;
  listingTitle: string;
  targetPrice: number;
  startPrice: number;
  active: boolean;
  triggered: boolean;
  createdAt: string;
}

// Community safe meetup spots
export type SafeSpotType = 'police_station' | 'mall' | 'bank' | 'restaurant' | 'library';

export interface SafeSpot {
  id: string;
  name: string;
  type: SafeSpotType;
  address: string;
  city: string;
  /** Pinned coordinates on the live map (optional for legacy data) */
  lat?: number;
  lng?: number;
  isApproved: boolean;
  submittedById?: string;
  createdAt: string;
}

// Referral program
export interface Referral {
  id: string;
  referrerId: string;
  invitedEmail: string;
  invitedName?: string;
  status: 'invited' | 'joined' | 'rewarded';
  reward: number;
  createdAt: string;
}

export interface PayoutAccount {
  id: string;
  userId: string;
  kind: 'bank' | 'opay' | 'palmpay' | 'momo';
  bankName: string;
  accountNumber: string;
  accountName: string;
}

// Order Types
export type OrderStatus =
  | 'pending'
  | 'in_progress'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export interface OrderEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  listingId: string;
  listingTitle: string;
  listingType: ListingType;
  listingImage?: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar?: string;
  status: OrderStatus;
  price: number;
  fee: number;
  note?: string;
  deliveryNote?: string;
  // Agreed in-person meeting point (a community Safe Spot snapshot)
  meetup?: MeetupPoint;
  createdAt: string;
  completedAt?: string;
  timeline: OrderEvent[];
  reviewed?: boolean;
  // true when the seller is a demo account that nobody can sign in as
  demoSeller?: boolean;
  // token-gated download for digital purchases
  downloadToken?: string;
  downloads?: number;
}

// Snapshot of the Safe Spot chosen as an order's meetup point
export interface MeetupPoint {
  spotId?: string;
  name: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'order' | 'review' | 'system' | 'payment' | 'referral' | 'safety';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// Safety Types
export interface TrustedContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
}

// Testimonial Types
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  quote: string;
  rating: number;
}

// Stats Types
export interface PlatformStats {
  totalUsers: number;
  totalListings: number;
  completedOrders: number;
  averageRating: number;
}
