import type { Category, Listing, Testimonial, User } from '@/types';

export const categories: Category[] = [
  {
    id: '1',
    name: 'Gigs',
    slug: 'gigs',
    description: 'Short digital jobs - writing, design, voiceover, coding, video editing',
    icon: 'Briefcase',
    image: '/images/category_gigs.jpg',
    listingCount: 2453,
    subcategories: ['Writing', 'Design', 'Voiceover', 'Coding', 'Video Editing', 'Translation']
  },
  {
    id: '2',
    name: 'Tasks',
    slug: 'tasks',
    description: 'Errands, shopping, document drop-off, printing',
    icon: 'ClipboardList',
    image: '/images/category_tasks.jpg',
    listingCount: 1821,
    subcategories: ['Errands', 'Shopping', 'Delivery', 'Printing', 'Cleaning', 'Organization']
  },
  {
    id: '3',
    name: 'Jobs',
    slug: 'jobs',
    description: 'Remote roles - customer service, data entry, virtual assistant',
    icon: 'Laptop',
    image: '/images/category_jobs.jpg',
    listingCount: 967,
    subcategories: ['Customer Service', 'Data Entry', 'Virtual Assistant', 'Sales', 'Marketing']
  },
  {
    id: '4',
    name: 'Services',
    slug: 'services',
    description: 'Tutoring, legal advice, business consulting, fitness coaching',
    icon: 'Users',
    image: '/images/category_services.jpg',
    listingCount: 1543,
    subcategories: ['Tutoring', 'Legal', 'Consulting', 'Coaching', 'Repairs', 'Events']
  },
  {
    id: '5',
    name: 'Digital Products',
    slug: 'digital',
    description: 'E-books, templates, music, art, software tools',
    icon: 'Download',
    image: '/images/category_digital.jpg',
    listingCount: 3210,
    subcategories: ['E-books', 'Templates', 'Music', 'Art', 'Software', 'Courses']
  }
];

export const featuredListings: Listing[] = [
  {
    id: '1',
    title: 'Professional Logo Design',
    description: 'I will create a stunning, modern logo for your business with unlimited revisions.',
    type: 'gig',
    category: 'Design',
    price: 15000,
    priceType: 'fixed',
    location: 'Lagos',
    isRemote: true,
    images: ['/images/creative_work.jpg'],
    seller: {
      id: 's1',
      name: 'Chioma Designs',
      email: 'chioma@example.com',
      role: 'general',
      isVerified: true,
      phoneVerified: true,
      idVerified: true,
      rating: 4.9,
      reviewCount: 127,
      avatar: '/images/avatar_chioma.jpg',
      joinedAt: '2023-01-15',
      walletBalance: 45000
    },
    rating: 4.9,
    reviewCount: 127,
    completedOrders: 342,
    tags: ['logo', 'branding', 'design'],
    createdAt: '2024-01-10',
    isFeatured: true,
    isActive: true
  },
  {
    id: '2',
    title: 'Virtual Assistant - Data Entry',
    description: 'Experienced VA for data entry, email management, and scheduling.',
    type: 'job',
    category: 'Virtual Assistant',
    price: 5000,
    priceType: 'hourly',
    location: 'Abuja',
    isRemote: true,
    images: ['/images/category_jobs.jpg'],
    seller: {
      id: 's2',
      name: 'Amara Okafor',
      email: 'amara@example.com',
      role: 'student',
      isVerified: true,
      phoneVerified: true,
      idVerified: false,
      rating: 4.7,
      reviewCount: 43,
      avatar: '/images/avatar_amara.jpg',
      joinedAt: '2023-06-20',
      walletBalance: 12000
    },
    rating: 4.7,
    reviewCount: 43,
    completedOrders: 89,
    tags: ['virtual assistant', 'data entry', 'admin'],
    createdAt: '2024-02-05',
    isFeatured: true,
    isActive: true
  },
  {
    id: '3',
    title: 'Math & Physics Tutoring',
    description: 'Expert tutoring for secondary school and university students. Online sessions available.',
    type: 'service',
    category: 'Tutoring',
    price: 8000,
    priceType: 'hourly',
    location: 'Lagos',
    isRemote: true,
    images: ['/images/category_services.jpg'],
    seller: {
      id: 's3',
      name: 'Dr. Ibrahim',
      email: 'ibrahim@example.com',
      role: 'general',
      isVerified: true,
      phoneVerified: true,
      idVerified: true,
      rating: 5.0,
      reviewCount: 89,
      avatar: '/images/avatar_ibrahim.jpg',
      joinedAt: '2022-11-08',
      walletBalance: 78000
    },
    rating: 5.0,
    reviewCount: 89,
    completedOrders: 156,
    tags: ['tutoring', 'math', 'physics', 'education'],
    createdAt: '2024-01-20',
    isFeatured: true,
    isActive: true
  },
  {
    id: '4',
    title: 'Grocery Shopping & Delivery',
    description: 'I will shop for your groceries from any store and deliver to your doorstep.',
    type: 'task',
    category: 'Shopping',
    price: 3000,
    priceType: 'fixed',
    location: 'Lagos',
    isRemote: false,
    images: ['/images/category_tasks.jpg'],
    seller: {
      id: 's4',
      name: 'Tunde Delivery',
      email: 'tunde@example.com',
      role: 'general',
      isVerified: true,
      phoneVerified: true,
      idVerified: true,
      rating: 4.8,
      reviewCount: 234,
      avatar: '/images/avatar_tunde.jpg',
      joinedAt: '2023-03-12',
      walletBalance: 56000
    },
    rating: 4.8,
    reviewCount: 234,
    completedOrders: 512,
    tags: ['shopping', 'delivery', 'errands'],
    createdAt: '2024-02-15',
    isFeatured: true,
    isActive: true
  },
  {
    id: '5',
    title: 'Business Plan Template Pack',
    description: 'Professional business plan templates with financial projections and market analysis.',
    type: 'digital',
    category: 'Templates',
    price: 5000,
    priceType: 'fixed',
    location: undefined,
    isRemote: true,
    images: ['/images/category_digital.jpg'],
    seller: {
      id: 's5',
      name: 'Ngozi Templates',
      email: 'ngozi@example.com',
      role: 'general',
      isVerified: true,
      phoneVerified: true,
      idVerified: false,
      rating: 4.9,
      reviewCount: 312,
      avatar: '/images/avatar_ngozi.jpg',
      joinedAt: '2022-08-30',
      walletBalance: 125000
    },
    rating: 4.9,
    reviewCount: 312,
    completedOrders: 892,
    tags: ['business', 'templates', 'planning'],
    createdAt: '2024-01-05',
    isFeatured: true,
    isActive: true
  },
  {
    id: '6',
    title: 'Event Photography',
    description: 'Professional photography for weddings, birthdays, and corporate events.',
    type: 'service',
    category: 'Events',
    price: 50000,
    priceType: 'fixed',
    location: 'Port Harcourt',
    isRemote: false,
    images: ['/images/tasker_photographer.jpg'],
    seller: {
      id: 's6',
      name: 'Kemi Photos',
      email: 'kemi@example.com',
      role: 'general',
      isVerified: true,
      phoneVerified: true,
      idVerified: true,
      rating: 4.9,
      reviewCount: 178,
      avatar: '/images/avatar_kemi.jpg',
      joinedAt: '2023-02-14',
      walletBalance: 89000
    },
    rating: 4.9,
    reviewCount: 178,
    completedOrders: 267,
    tags: ['photography', 'events', 'wedding'],
    createdAt: '2024-02-20',
    isFeatured: true,
    isActive: true
  }
];

export const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Amara',
    role: 'Student',
    avatar: '/images/avatar_amara.jpg',
    quote: 'I posted a gig and got booked the same evening. Dealmint made it so easy to start earning as a student!',
    rating: 5
  },
  {
    id: '2',
    name: 'Tunde',
    role: 'Product Manager',
    avatar: '/images/avatar_tunde.jpg',
    quote: 'Finally a platform that feels safe for errands. The verification system gives me peace of mind.',
    rating: 5
  },
  {
    id: '3',
    name: 'Chioma',
    role: 'Freelancer',
    avatar: '/images/avatar_chioma.jpg',
    quote: 'I turned weekend tasks into consistent income. The wallet system is fast and reliable.',
    rating: 5
  },
  {
    id: '4',
    name: 'Ibrahim',
    role: 'Founder',
    avatar: '/images/avatar_ibrahim.jpg',
    quote: 'Clear pricing, no haggling. I found a great VA for my startup within hours.',
    rating: 5
  },
  {
    id: '5',
    name: 'Ngozi',
    role: 'Designer',
    avatar: '/images/avatar_ngozi.jpg',
    quote: 'Support actually replies. That matters. When I had an issue, it was resolved in hours.',
    rating: 5
  },
  {
    id: '6',
    name: 'Kemi',
    role: 'Parent',
    avatar: '/images/avatar_kemi.jpg',
    quote: 'Hired a tutor in 10 minutes. My daughter\'s grades improved significantly!',
    rating: 5
  }
];

export const featuredTaskers: User[] = [
  {
    id: 't1',
    name: 'Chioma Designs',
    email: 'chioma@example.com',
    role: 'general',
    isVerified: true,
    phoneVerified: true,
    idVerified: true,
    rating: 4.9,
    reviewCount: 127,
    avatar: '/images/avatar_chioma.jpg',
    bio: 'Professional graphic designer with 5+ years experience in branding and logo design.',
    skills: ['Logo Design', 'Branding', 'Illustration', 'UI/UX'],
    location: 'Lagos',
    joinedAt: '2023-01-15',
    walletBalance: 45000
  },
  {
    id: 't2',
    name: 'Tunde Delivery',
    email: 'tunde@example.com',
    role: 'general',
    isVerified: true,
    phoneVerified: true,
    idVerified: true,
    rating: 4.8,
    reviewCount: 234,
    avatar: '/images/avatar_tunde.jpg',
    bio: 'Reliable delivery expert covering all of Lagos. Fast, safe, and professional service.',
    skills: ['Delivery', 'Shopping', 'Errands', 'Logistics'],
    location: 'Lagos',
    joinedAt: '2023-03-12',
    walletBalance: 56000
  },
  {
    id: 't3',
    name: 'Dr. Ibrahim',
    email: 'ibrahim@example.com',
    role: 'general',
    isVerified: true,
    phoneVerified: true,
    idVerified: true,
    rating: 5.0,
    reviewCount: 89,
    avatar: '/images/avatar_ibrahim.jpg',
    bio: 'PhD in Mathematics with 10+ years teaching experience. Making complex concepts simple.',
    skills: ['Mathematics', 'Physics', 'Tutoring', 'Education'],
    location: 'Abuja',
    joinedAt: '2022-11-08',
    walletBalance: 78000
  },
  {
    id: 't4',
    name: 'Kemi Photos',
    email: 'kemi@example.com',
    role: 'general',
    isVerified: true,
    phoneVerified: true,
    idVerified: true,
    rating: 4.9,
    reviewCount: 178,
    avatar: '/images/avatar_kemi.jpg',
    bio: 'Award-winning photographer specializing in events, portraits, and commercial work.',
    skills: ['Photography', 'Videography', 'Editing', 'Events'],
    location: 'Port Harcourt',
    joinedAt: '2023-02-14',
    walletBalance: 89000
  }
];

export const platformStats = {
  totalUsers: 45000,
  totalListings: 12500,
  completedOrders: 89000,
  averageRating: 4.8
};

export const howItWorksSteps = [
  {
    number: '01',
    title: 'Post or Browse',
    description: 'Create a listing for your skills or browse thousands of available gigs and services.'
  },
  {
    number: '02',
    title: 'Chat & Confirm',
    description: 'Message directly, discuss details, and agree on terms before starting.'
  },
  {
    number: '03',
    title: 'Get It Done',
    description: 'Complete the work, receive payment securely, and build your reputation.'
  }
];

export const safetyFeatures = [
  {
    icon: 'Shield',
    title: 'ID Verification',
    description: 'All service providers undergo thorough identity verification.'
  },
  {
    icon: 'Lock',
    title: 'Secure Payments',
    description: 'Your money is held safely in escrow until work is completed.'
  },
  {
    icon: 'Phone',
    title: 'Phone Verification',
    description: 'Every user verifies their phone number for added security.'
  },
  {
    icon: 'HeadphonesIcon',
    title: '24/7 Support',
    description: 'Our support team is always ready to help with any issues.'
  }
];

export const pricingPlans = [
  {
    name: 'Requester',
    description: 'For those hiring help',
    price: 'Free',
    priceDetail: 'to post',
    features: [
      'Free to post requests',
      'Pay only when you book',
      'Verified doers',
      'In-app chat',
      'Secure payments',
      'Dispute support'
    ]
  },
  {
    name: 'Doer',
    description: 'For those offering services',
    price: '10-15%',
    priceDetail: 'commission',
    features: [
      'Free to list services',
      'Only pay when you earn',
      'Student: 10% fee',
      'General: 15% fee',
      'Instant withdrawals',
      'Referral bonuses'
    ]
  }
];
