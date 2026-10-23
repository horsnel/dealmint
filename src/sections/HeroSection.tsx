import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, ChevronDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const subheadlineRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollHintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const circle = circleRef.current;
    const headline = headlineRef.current;
    const subheadline = subheadlineRef.current;
    const cta = ctaRef.current;
    const scrollHint = scrollHintRef.current;

    if (!section || !circle || !headline || !subheadline || !cta) return;

    const ctx = gsap.context(() => {
      // Initial load animation
      const loadTl = gsap.timeline({ defaults: { ease: 'power2.out' } });

      // Circle entrance
      loadTl.fromTo(
        circle,
        { scale: 0.65, opacity: 0, y: 40 },
        { scale: 1, opacity: 1, y: 0, duration: 1 }
      );

      // Headline lines entrance
      const headlineLines = headline.querySelectorAll('.headline-line');
      loadTl.fromTo(
        headlineLines,
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.08 },
        '-=0.6'
      );

      // Subheadline entrance
      loadTl.fromTo(
        subheadline,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.3'
      );

      // CTA entrance
      loadTl.fromTo(
        cta,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 },
        '-=0.3'
      );

      // Scroll hint entrance
      if (scrollHint) {
        loadTl.fromTo(
          scrollHint,
          { opacity: 0 },
          { opacity: 0.7, duration: 0.5 },
          '-=0.2'
        );
      }

      // Scroll-driven exit animation
      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=130%',
          pin: true,
          scrub: 0.6,
        },
      });

      // Exit animations (70% - 100%)
      scrollTl.fromTo(
        headline,
        { y: 0, opacity: 1 },
        { y: '-28vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        circle,
        { x: 0, scale: 1, opacity: 1 },
        { x: '18vw', scale: 0.85, opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        cta,
        { y: 0, opacity: 1 },
        { y: '18vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        subheadline,
        { y: 0, opacity: 1 },
        { y: '12vh', opacity: 0, ease: 'power2.in' },
        0.7
      );

      if (scrollHint) {
        scrollTl.fromTo(
          scrollHint,
          { opacity: 0.7 },
          { opacity: 0, ease: 'power2.in' },
          0.7
        );
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-violet-500 overflow-hidden z-10"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-4">
        {/* Headline */}
        <div
          ref={headlineRef}
          className="text-center mb-6 lg:mb-8"
          style={{ marginTop: '-15vh' }}
        >
          <h1 className="font-display font-black text-white uppercase tracking-tight">
            <span className="headline-line block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
              FIND IT.
            </span>
            <span className="headline-line block text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
              POST IT.
            </span>
            <span className="headline-line block text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-amber-400">
              DONE.
            </span>
          </h1>
        </div>

        {/* Circle Portal with Image */}
        <div
          ref={circleRef}
          className="circle-portal w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 mb-6 lg:mb-8"
        >
          <img
            src="/images/hero_team_collab.jpg"
            alt="Team collaboration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Subheadline */}
        <p
          ref={subheadlineRef}
          className="text-center text-white/90 text-base sm:text-lg md:text-xl max-w-xl mb-8 px-4"
        >
          Dealmint connects doers and requesters—fast, safe, and local.
        </p>

        {/* CTA Buttons */}
        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            to="/browse"
            className="btn-primary flex items-center gap-2 text-base"
          >
            Browse Listings
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/post/gig"
            className="btn-outline flex items-center gap-2 text-base"
          >
            Post a Gig
          </Link>
        </div>

        {/* Scroll Hint */}
        <div
          ref={scrollHintRef}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-sm flex flex-col items-center gap-2"
        >
          <span>Scroll to explore</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
