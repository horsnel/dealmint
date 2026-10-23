import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function FinalCTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const circle = circleRef.current;
    const headline = headlineRef.current;
    const content = contentRef.current;

    if (!section || !circle || !headline || !content) return;

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
        { scale: 0.65, opacity: 0 },
        { scale: 1, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        headline.querySelectorAll('.headline-line'),
        { y: '-40vh', opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, ease: 'none' },
        0.05
      );

      scrollTl.fromTo(
        content.querySelectorAll('.animate-item'),
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.05, ease: 'none' },
        0.1
      );

      // Exit (70% - 100%)
      scrollTl.fromTo(
        circle,
        { scale: 1, opacity: 1 },
        { scale: 0.92, opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        headline.querySelectorAll('.headline-line'),
        { y: 0, opacity: 1 },
        { y: '-18vh', opacity: 0, stagger: 0.02, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        content.querySelectorAll('.animate-item'),
        { y: 0, opacity: 1 },
        { y: '18vh', opacity: 0, stagger: 0.02, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-violet-500 overflow-hidden z-[110]"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-amber-400/30 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/20 blur-3xl" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* Headline */}
        <div ref={headlineRef} className="text-center mb-6 lg:mb-8">
          <h2 className="font-display font-black text-white uppercase tracking-tight">
            <span className="headline-line block text-4xl sm:text-5xl md:text-6xl lg:text-7xl">
              READY WHEN
            </span>
            <span className="headline-line block text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-amber-400">
              YOU ARE
            </span>
          </h2>
        </div>

        {/* Circle Portal with Image */}
        <div
          ref={circleRef}
          className="circle-portal w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mb-6 lg:mb-8"
        >
          <img
            src="/images/closing_community.jpg"
            alt="Community"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Content */}
        <div ref={contentRef} className="text-center">
          <p className="animate-item text-white/90 text-base sm:text-lg md:text-xl max-w-xl mb-8 px-4">
            Join your local community of doers and requesters. Fast, fair, and hassle-free.
          </p>

          {/* CTA Buttons */}
          <div className="animate-item flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              to="/register"
              className="btn-primary flex items-center gap-2 text-base"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/browse"
              className="btn-outline flex items-center gap-2 text-base"
            >
              Browse Listings
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
