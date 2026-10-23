import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Search, Mail, Download, Users, Heart, ShieldCheck, MessageCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EmptyState } from '@/components/common/EmptyState';
import { usePageTitle } from '@/hooks/usePageTitle';

function InfoLayout({
  title,
  subtitle,
  updated,
  children,
}: {
  title: string;
  subtitle?: string;
  updated?: string;
  children: ReactNode;
}) {
  usePageTitle(title);
  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        <div className="mb-10">
          <h1 className="font-display font-bold text-3xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            {title}
          </h1>
          {subtitle && <p className="text-gray-600 dark:text-gray-300 text-lg">{subtitle}</p>}
          {updated && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Last updated {updated}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

interface Section {
  heading: string;
  body: string[];
}

function Prose({ sections }: { sections: Section[] }) {
  return (
    <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 lg:p-10 space-y-8">
      {sections.map((s, i) => (
        <section key={s.heading}>
          <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-3">
            {i + 1}. {s.heading}
          </h2>
          <div className="space-y-3">
            {s.body.map((p, j) => (
              <p key={j} className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Terms
export function TermsPage() {
  return (
    <InfoLayout title="Terms of Service" subtitle="The rules for using Dealmint." updated="1 October 2026">
      <Prose
        sections={[
          {
            heading: 'Accepting these terms',
            body: [
              'By creating an account or using Dealmint you agree to these Terms and to our Privacy Policy. If you do not agree, please do not use the platform.',
              'You must be at least 18 years old, or have the consent of a parent or guardian, to use Dealmint.',
            ],
          },
          {
            heading: 'Your account',
            body: [
              'You are responsible for keeping your login details safe and for everything that happens under your account. Give accurate information and keep it up to date.',
              'You may not create accounts for anyone else, share your account, or use another person\u2019s identity.',
            ],
          },
          {
            heading: 'Listings and orders',
            body: [
              'Sellers are responsible for the accuracy of their listings, for delivering what they promise, and for following the law. Buyers are responsible for giving clear instructions and paying for work they accept.',
              'Dealmint is a marketplace. We are not a party to the contract between buyer and seller, but we provide tools such as escrow and dispute support to help both sides.',
            ],
          },
          {
            heading: 'Payments and escrow',
            body: [
              'When you place an order, the payment is held in escrow. It is released to the seller after you confirm delivery, or refunded if the order is cancelled before work starts.',
              'Dealmint charges a commission on completed orders: 15% for general users and 10% for verified students. The commission is deducted from the seller\u2019s earnings.',
            ],
          },
          {
            heading: 'Prohibited activity',
            body: [
              'You may not list illegal goods or services, mislead other users, harass anyone, take payments or conversations off the platform to avoid fees, post fake reviews, or attempt to interfere with the security of the service.',
            ],
          },
          {
            heading: 'Disputes',
            body: [
              'If something goes wrong with an order, open a dispute from the order page. We will review the order history and messages and work with both parties to reach a fair outcome.',
            ],
          },
          {
            heading: 'Suspension and closing accounts',
            body: [
              'We may suspend or close accounts that break these Terms or put other users at risk. You can close your own account at any time from Settings.',
            ],
          },
          {
            heading: 'Changes and contact',
            body: [
              'We may update these Terms from time to time. We will tell you about important changes. Questions? Reach us through the Contact page or at support@dealmint.ng.',
            ],
          },
        ]}
      />
    </InfoLayout>
  );
}

// ---------------------------------------------------------------- Privacy
export function PrivacyPage() {
  return (
    <InfoLayout
      title="Privacy Policy"
      subtitle="What we collect, why we collect it and the choices you have."
      updated="1 October 2026"
    >
      <Prose
        sections={[
          {
            heading: 'Information we collect',
            body: [
              'Account details such as your name, email, phone number and password; profile details you add; listing content; messages; order and payment activity; and basic device and usage information.',
            ],
          },
          {
            heading: 'How we use it',
            body: [
              'To run the marketplace, process orders and payouts, verify accounts, keep people safe, prevent fraud, provide support, and improve Dealmint. We only send marketing messages if you agree to them.',
            ],
          },
          {
            heading: 'Who sees your information',
            body: [
              'Your public profile and listings are visible to other users. Your email, phone number and wallet details are private. You can hide your phone number and location from your profile in Settings.',
              'We share data with payment and identity partners only as needed to provide those services, and when the law requires it.',
            ],
          },
          {
            heading: 'Your rights under the NDPR',
            body: [
              'In line with the Nigeria Data Protection Regulation, you can ask to access, correct, export or delete your personal data, and you can withdraw consent at any time. You can delete your account from Settings, or contact us for help.',
            ],
          },
          {
            heading: 'Security and retention',
            body: [
              'We use industry-standard safeguards to protect your data. We keep information only as long as needed for the purposes above or to meet legal and accounting requirements.',
            ],
          },
          {
            heading: 'Cookies and storage',
            body: [
              'We use browser storage and cookies to keep you signed in and remember your preferences. See our Cookie Policy for details.',
            ],
          },
          {
            heading: 'Contact',
            body: ['For privacy questions or requests, email privacy@dealmint.ng.'],
          },
        ]}
      />
    </InfoLayout>
  );
}

// ---------------------------------------------------------------- Cookies
export function CookiesPage() {
  return (
    <InfoLayout title="Cookie Policy" subtitle="How Dealmint uses cookies and similar storage." updated="1 October 2026">
      <Prose
        sections={[
          {
            heading: 'What they are',
            body: [
              'Cookies and browser storage are small pieces of data saved on your device that help websites remember you.',
            ],
          },
          {
            heading: 'What we use',
            body: [
              'Essential storage keeps you signed in and keeps your wallet, orders and messages working. Preference storage remembers choices such as light or dark mode. We do not use advertising cookies.',
            ],
          },
          {
            heading: 'Managing storage',
            body: [
              'You can clear cookies and site data in your browser settings at any time. Doing so will sign you out, and some features may stop working until you sign in again.',
            ],
          },
        ]}
      />
    </InfoLayout>
  );
}

// ---------------------------------------------------------------- Careers
const roles = [
  { title: 'Senior Frontend Engineer', team: 'Engineering', place: 'Lagos or Remote (Nigeria)', type: 'Full-time' },
  { title: 'Trust & Safety Specialist', team: 'Operations', place: 'Lagos', type: 'Full-time' },
  { title: 'Community Manager', team: 'Growth', place: 'Remote (Nigeria)', type: 'Full-time' },
  { title: 'Customer Support Associate', team: 'Support', place: 'Abuja', type: 'Contract' },
];

export function CareersPage() {
  return (
    <InfoLayout
      title="Careers"
      subtitle="Help us build the easiest way to earn and hire across Africa."
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Users, title: 'Small, fast team', text: 'Ship things that real people use every day.' },
          { icon: Heart, title: 'Care about people', text: 'We build for students, freelancers and small businesses.' },
          { icon: Sparkles, title: 'Grow quickly', text: 'Own big problems early and learn from great peers.' },
        ].map((b) => (
          <div key={b.title} className="card-white dark:bg-violet-800 dark:border-violet-700 p-5">
            <b.icon className="w-6 h-6 text-violet-600 dark:text-amber-400 mb-3" />
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">{b.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{b.text}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">Open roles</h2>
      <div className="space-y-3">
        {roles.map((r) => (
          <div
            key={r.title}
            className="card-white dark:bg-violet-800 dark:border-violet-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{r.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {r.team} · {r.place} · {r.type}
              </p>
            </div>
            <a href={`mailto:careers@dealmint.ng?subject=${encodeURIComponent('Application: ' + r.title)}`}>
              <Button className="bg-violet-600 hover:bg-violet-700">Apply</Button>
            </a>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 mt-6">
        Do not see your role? Send your CV to{' '}
        <a href="mailto:careers@dealmint.ng" className="text-violet-600 dark:text-amber-400 hover:underline">
          careers@dealmint.ng
        </a>
        .
      </p>
    </InfoLayout>
  );
}

// ---------------------------------------------------------------- Blog
const posts = [
  {
    title: '5 tips for a gig listing that actually gets orders',
    date: '14 Oct 2026',
    tag: 'Selling',
    excerpt: 'Clear titles, honest pricing and good photos make the biggest difference.',
    body: 'Start with a title that says exactly what the buyer gets. Add two or three real photos, state your delivery time, and keep your description focused on the result rather than yourself. Reply to messages quickly: sellers who respond within an hour convert far more enquiries into orders.',
  },
  {
    title: 'How escrow keeps both sides safe',
    date: '2 Oct 2026',
    tag: 'Safety',
    excerpt: 'Your money is protected until you are happy with the work.',
    body: 'When you place an order, your payment moves into escrow rather than straight to the seller. The seller starts work knowing the funds are there, and you only release them once the delivery looks right. If something goes wrong, you can open a dispute before the money is released.',
  },
  {
    title: 'Student hustle: earning while you study',
    date: '21 Sep 2026',
    tag: 'Students',
    excerpt: 'From tutoring to design, ideas that fit around lectures.',
    body: 'Pick one skill you already have and package it simply: a logo for a small business, an hour of exam revision, or a poster for a campus event. Verified students also pay a lower 10% commission on every order.',
  },
  {
    title: 'Spotting and avoiding scams online',
    date: '5 Sep 2026',
    tag: 'Safety',
    excerpt: 'A short checklist for staying safe when you buy and sell.',
    body: 'Keep payments and conversations on Dealmint, be careful with urgent requests, and never share your password or one-time codes. If a deal sounds too good to be true, report the listing from its page and our team will take a look.',
  },
];

export function BlogPage() {
  return (
    <InfoLayout title="Blog" subtitle="Guides, updates and stories from the Dealmint team.">
      <Accordion type="single" collapsible className="space-y-4">
        {posts.map((p) => (
          <AccordionItem
            key={p.title}
            value={p.title}
            className="card-white dark:bg-violet-800 dark:border-violet-700 px-6 border"
          >
            <AccordionTrigger className="hover:no-underline text-left">
              <div>
                <p className="text-xs text-violet-600 dark:text-amber-400 font-medium mb-1">
                  {p.tag} · {p.date}
                </p>
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">{p.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 font-normal mt-1">{p.excerpt}</p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {p.body}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </InfoLayout>
  );
}

// ---------------------------------------------------------------- Press
export function PressPage() {
  return (
    <InfoLayout title="Press" subtitle="Resources for journalists and partners.">
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6">
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">About Dealmint</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            Dealmint is a Nigerian marketplace where people hire trusted help and earn from gigs, tasks, remote
            jobs, services and digital products, with escrow-protected payments.
          </p>
        </div>
        <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6">
          <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">Press contact</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">For interviews, statements and partnerships.</p>
          <a href="mailto:press@dealmint.ng" className="inline-flex items-center gap-2 text-violet-600 dark:text-amber-400 font-medium hover:underline">
            <Mail className="w-4 h-4" />
            press@dealmint.ng
          </a>
        </div>
      </div>

      <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-4">Brand basics</h2>
      <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          {[
            { name: 'Violet', hex: '#6B46C1' },
            { name: 'Amber', hex: '#F59E0B' },
            { name: 'Lavender', hex: '#F3F0FF' },
          ].map((c) => (
            <div key={c.name} className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-lg border border-gray-200 dark:border-violet-600" style={{ backgroundColor: c.hex }} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">{c.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.hex}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Typefaces: League Spartan for headings, Inter for body text and Space Grotesk for accents.
        </p>
        <a href="/favicon.svg" download>
          <Button variant="outline" className="dark:border-violet-600 dark:text-white">
            <Download className="w-4 h-4 mr-2" />
            Download logo mark
          </Button>
        </a>
      </div>
    </InfoLayout>
  );
}

// ---------------------------------------------------------------- Help
const faqs = [
  { q: 'How do I place an order?', a: 'Open a listing, choose Book Now (or Apply Now / Make an Offer), add any details for the seller and pay from your wallet. Your payment is held in escrow.' },
  { q: 'How do I add money to my wallet?', a: 'Go to Wallet and choose Deposit. Pick an amount and a payment method. Funds appear in your balance immediately.' },
  { q: 'When does the seller get paid?', a: 'After you confirm delivery. Until then your payment stays in escrow. Digital products are delivered and paid out instantly.' },
  { q: 'How do I withdraw my earnings?', a: 'Add a bank or mobile money account in Wallet, then choose Withdraw. The minimum withdrawal is ₦1,000.' },
  { q: 'What does Dealmint charge?', a: 'A commission on completed orders: 15% for general users and 10% for verified students. Buying is free.' },
  { q: 'How do I become a verified student?', a: 'Open Profile and choose Verify student status. Use your school email ending in .edu.ng or .edu.' },
  { q: 'What if I am not happy with an order?', a: 'Message the seller first. If you cannot agree, open a dispute from the order page before confirming delivery.' },
  { q: 'How do I cancel an order?', a: 'You can cancel a pending order from its page for a full refund. After work has started, open a dispute instead.' },
  { q: 'How do I report a listing or user?', a: 'Use the Report button on the listing page, or block a person from the Messages page.' },
  { q: 'I forgot my password.', a: 'Choose Forgot password on the sign in page and follow the steps to reset it with a code.' },
  { q: 'How do I delete my account?', a: 'Go to Settings, then Delete account. This removes your listings, messages and wallet records.' },
];

export function HelpPage() {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    return t ? faqs.filter((f) => f.q.toLowerCase().includes(t) || f.a.toLowerCase().includes(t)) : faqs;
  }, [query]);

  return (
    <InfoLayout title="Help Center" subtitle="Answers to common questions.">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles..."
          aria-label="Search help articles"
          className="pl-10 dark:bg-violet-800 dark:border-violet-700"
        />
      </div>

      {filtered.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-3">
          {filtered.map((f) => (
            <AccordionItem
              key={f.q}
              value={f.q}
              className="card-white dark:bg-violet-800 dark:border-violet-700 px-6 border"
            >
              <AccordionTrigger className="hover:no-underline text-left font-semibold text-gray-900 dark:text-white">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <EmptyState icon={Search} title="No matching articles" description="Try different words, or contact our team." />
      )}

      <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 mt-10 text-center">
        <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-2">Still need help?</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">Our support team replies within one business day.</p>
        <Link to="/contact">
          <Button className="bg-violet-600 hover:bg-violet-700">Contact support</Button>
        </Link>
      </div>
    </InfoLayout>
  );
}

// ---------------------------------------------------------------- Community
export function CommunityPage() {
  const rules = [
    { icon: Heart, title: 'Be respectful', text: 'Treat everyone with courtesy. No harassment, hate or discrimination.' },
    { icon: ShieldCheck, title: 'Stay on platform', text: 'Keep payments and conversations on Dealmint so you are protected by escrow.' },
    { icon: MessageCircle, title: 'Communicate clearly', text: 'Reply promptly, set honest expectations and keep your word on delivery.' },
    { icon: Sparkles, title: 'Be genuine', text: 'No fake reviews, duplicate listings or misleading photos.' },
  ];
  return (
    <InfoLayout title="Community Guidelines" subtitle="How we keep Dealmint a good place to work and hire.">
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        {rules.map((r) => (
          <div key={r.title} className="card-white dark:bg-violet-800 dark:border-violet-700 p-6">
            <r.icon className="w-6 h-6 text-violet-600 dark:text-amber-400 mb-3" />
            <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-1">{r.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">{r.text}</p>
          </div>
        ))}
      </div>
      <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6">
        <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">See something wrong?</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Report a listing from its page, or block a user from Messages. Visit the Safety Center for more tips.
        </p>
        <Link to="/safety">
          <Button variant="outline" className="dark:border-violet-600 dark:text-white">
            Visit Safety Center
          </Button>
        </Link>
      </div>
    </InfoLayout>
  );
}
