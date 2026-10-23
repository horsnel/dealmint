import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowRight, Shield, Lock, Phone, Headphones } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const safetyFeatures = [
  { icon: Shield, label: 'ID Verification' },
  { icon: Lock, label: 'Secure Payments' },
  { icon: Phone, label: 'Phone Verification' },
  { icon: Headphones, label: '24/7 Support' },
];

export function SafetySection() {
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
        { x: '-60vw', scale: 0.7, opacity: 0 },
        { x: 0, scale: 1, opacity: 1, ease: 'none' },
        0
      );

      scrollTl.fromTo(
        content.querySelectorAll('.animate-item'),
        { x: '40vw', opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.05, ease: 'none' },
        0.05
      );

      // Exit (70% - 100%)
      scrollTl.fromTo(
        circle,
        { x: 0, scale: 1, opacity: 1 },
        { x: '-22vw', scale: 0.9, opacity: 0, ease: 'power2.in' },
        0.7
      );

      scrollTl.fromTo(
        content.querySelectorAll('.animate-item'),
        { x: 0, opacity: 1 },
        { x: '18vw', opacity: 0, stagger: 0.02, ease: 'power2.in' },
        0.7
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-violet-500 overflow-hidden z-[80]"
    >
      <div className="h-full flex items-center px-4 sm:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Circle Portal - Left */}
          <div className="flex justify-center lg:justify-start order-2 lg:order-1">
            <div
              ref={circleRef}
              className="circle-portal w-64 h-64 sm:w-80 sm:h-80 lg:w-[480px] lg:h-[480px]"
            >
              <img
                src="/images/safety_check.jpg"
                alt="Safety and trust"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content - Right */}
          <div ref={contentRef} className="order-1 lg:order-2 text-center lg:text-left">
            <h2 className="animate-item font-display font-black text-white uppercase text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2">
              VERIFIED.
            </h2>
            <h2 className="animate-item font-display font-black text-amber-400 uppercase text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2">
              INSURED.
            </h2>
            <h2 className="animate-item font-display font-black text-white uppercase text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-6">
              SUPPORTED.
            </h2>
            
            <p className="animate-item text-white/90 text-base sm:text-lg max-w-md mx-auto lg:mx-0 mb-8">
              ID checks, secure payments, and a support team that responds fast. If something's off, we're on it.
            </p>

            {/* Safety Features */}
            <div className="animate-item flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
              {safetyFeatures.map((feature) => (
                <span
                  key={feature.label}
                  className="pill flex items-center gap-2 text-white"
                >
                  <feature.icon className="w-4 h-4 text-amber-400" />
                  {feature.label}
                </span>
              ))}
            </div>

            <div className="animate-item flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                to="/safety"
                className="btn-primary flex items-center gap-2"
              >
                Learn About Safety
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
