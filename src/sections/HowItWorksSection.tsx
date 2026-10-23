import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Search, MessageSquare, Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: '01',
    title: 'Post or Browse',
    description: 'Create a listing for your skills or browse thousands of available gigs and services.',
    icon: Search,
  },
  {
    number: '02',
    title: 'Chat & Confirm',
    description: 'Message directly, discuss details, and agree on terms before starting.',
    icon: MessageSquare,
  },
  {
    number: '03',
    title: 'Get It Done',
    description: 'Complete the work, receive payment securely, and build your reputation.',
    icon: Star,
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const circle = circleRef.current;
    const content = contentRef.current;

    if (!section || !circle || !content) return;

    const ctx = gsap.context(() => {
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // Entrance (0% - 30%)
      scrollTl.fromTo(
        circle,
        { x: '60vw', scale: 0.7, opacity: 0 },
        { x: 0, scale: 1, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        content.querySelectorAll('.animate-item'),
        { x: '-40vw', opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.05, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        content.querySelectorAll('.step-item'),
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.08, ease: 'none' },
        0.12
      );

      // Exit (70% - 100%)
      scrollTl.fromTo(
        circle,
        { x: 0, scale: 1, opacity: 1 },
        { x: '22vw', scale: 0.9, opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        content.querySelectorAll('.animate-item, .step-item'),
        { x: 0, opacity: 1 },
        { x: '-18vw', opacity: 0, stagger: 0.02, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-violet-500 overflow-hidden z-50"
    >
      <div className="h-full flex items-center px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Content - Left */}
          <div ref={contentRef} className="text-center lg:text-left order-1">
            <h2 className="animate-item font-display font-black text-white uppercase text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-2">
              HOW IT
            </h2>
            <h2 className="animate-item font-display font-black text-amber-400 uppercase text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-8">
              WORKS
            </h2>

            {/* Steps */}
            <div className="space-y-6 mb-8">
              {steps.map((step) => (
                <div key={step.number} className="step-item flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-display font-bold text-white text-lg">
                      {step.title}
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="animate-item flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="btn-primary flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Circle Portal - Right */}
          <div className="flex justify-center lg:justify-end order-2">
            <div
              ref={circleRef}
              className="circle-portal w-64 h-64 sm:w-80 sm:h-80 lg:w-[480px] lg:h-[480px]"
            >
              <img
                src="/images/planning_meeting.jpg"
                alt="How it works"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
