import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function PostGigSection() {
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

      // Exit (70% - 100%)
      scrollTl.fromTo(
        circle,
        { x: 0, scale: 1, opacity: 1 },
        { x: '22vw', scale: 0.9, opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        content.querySelectorAll('.animate-item'),
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
      className="relative w-full h-screen bg-violet-500 overflow-hidden z-30"
    >
      <div className="h-full flex items-center px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Content - Left */}
          <div ref={contentRef} className="text-center lg:text-left order-1">
            <h2 className="animate-item font-display font-black text-white uppercase text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4">
              POST
            </h2>
            <h2 className="animate-item font-display font-black text-amber-400 uppercase text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
              A GIG
            </h2>
            
            <p className="animate-item text-white/90 text-base sm:text-lg max-w-md mx-auto lg:mx-0 mb-8">
              Set your price, define your schedule, and get paid safely. No monthly fees—just a simple commission.
            </p>

            <div className="animate-item flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mb-6">
              <Link
                to="/post/gig"
                className="btn-primary flex items-center gap-2"
              >
                Create a Listing
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="animate-item flex items-center gap-2 justify-center lg:justify-start">
              <span className="pill flex items-center gap-2 text-white">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Average first booking in 48 hrs
              </span>
            </div>
          </div>

          {/* Circle Portal - Right */}
          <div className="flex justify-center lg:justify-end order-2">
            <div
              ref={circleRef}
              className="circle-portal w-64 h-64 sm:w-80 sm:h-80 lg:w-[480px] lg:h-[480px]"
            >
              <img
                src="/images/creative_work.jpg"
                alt="Post a gig"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
