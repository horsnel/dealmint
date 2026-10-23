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
  studentVerified?: boolean;
  settings?: UserSettings;
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
}

// Wallet Types
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'earning' | 'refund' | 'bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
  reference?: string;
  orderId?: string;
  fee?: number;
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
  createdAt: string;
  completedAt?: string;
  timeline: OrderEvent[];
  reviewed?: boolean;
  // true when the seller is a demo account that nobody can sign in as
  demoSeller?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'order' | 'review' | 'system' | 'payment';
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
