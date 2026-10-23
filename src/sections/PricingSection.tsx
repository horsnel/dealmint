import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Link } from 'react-router-dom';
import { Check, User, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const pricingPlans = [
  {
    name: 'Requester',
    description: 'For those hiring help',
    price: 'Free',
    priceDetail: 'to post',
    icon: User,
    features: [
      'Free to post requests',
      'Pay only when you book',
      'Verified doers',
      'In-app chat',
      'Secure payments',
      'Dispute support',
    ],
  },
  {
    name: 'Doer',
    description: 'For those offering services',
    price: '10-15%',
    priceDetail: 'commission',
    icon: Briefcase,
    features: [
      'Free to list services',
      'Only pay when you earn',
      'Student: 10% fee',
      'General: 15% fee',
      'Instant withdrawals',
      'Referral bonuses',
    ],
  },
];

const includedFeatures = [
  'In-app chat',
  'Verified profiles',
  'Secure payments',
  'Dispute support',
];

export function PricingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const includedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;
    const included = includedRef.current;

    if (!section || !header || !cards || !included) return;

    const ctx = gsap.context(() => {
      // Header animation
      gsap.fromTo(
        header,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: header,
            start: 'top 80%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // Cards animation
      const cardElements = cards.querySelectorAll('.pricing-card');
      gsap.fromTo(
        cardElements,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.15,
          scrollTrigger: {
            trigger: cards,
            start: 'top 85%',
            end: 'top 55%',
            scrub: true,
          },
        }
      );

      // Included features animation
      gsap.fromTo(
        included,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          scrollTrigger: {
            trigger: included,
            start: 'top 85%',
            end: 'top 65%',
            scrub: true,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative w-full bg-lavender dark:bg-violet-900 py-16 lg:py-24 z-[100]"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-12 lg:mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            Simple Fees
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            No subscriptions. No hidden costs.
          </p>
        </div>

        {/* Pricing Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12"
        >
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className="pricing-card card-white dark:bg-violet-800 dark:border-violet-700 p-8 lg:p-10"
            >
              {/* Plan Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center">
                  <plan.icon className="w-6 h-6 text-violet-600 dark:text-violet-300" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {plan.description}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-8">
                <span className="text-4xl lg:text-5xl font-display font-bold text-violet-600 dark:text-amber-400">
                  {plan.price}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  {plan.priceDetail}
                </span>
              </div>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-200">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to={plan.name === 'Requester' ? '/browse' : '/post/gig'} className="block mt-8">
                <Button
                  className={
                    plan.name === 'Requester'
                      ? 'w-full bg-violet-600 hover:bg-violet-700 text-white'
                      : 'w-full bg-amber-500 hover:bg-amber-600 text-white'
                  }
                >
                  {plan.name === 'Requester' ? 'Start browsing' : 'Start earning'}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* What's Included */}
        <div
          ref={includedRef}
          className="text-center bg-white dark:bg-violet-800 rounded-2xl p-8 border border-gray-200 dark:border-violet-700"
        >
          <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white mb-6">
            What's Included for Everyone
          </h3>
          <div className="flex flex-wrap justify-center gap-4 lg:gap-8">
            {includedFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-200"
              >
                <Check className="w-5 h-5 text-violet-600 dark:text-amber-400" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
