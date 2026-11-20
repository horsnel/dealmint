import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronDown,
  Heart,
  MapPin,
  MessageSquare,
  MessageSquareDashed,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { usePageTitle } from '@/hooks/usePageTitle';

// Safety rules shown in the pre-signup awareness sheet. Each rule keeps its
// own accent colour — semantic safety colours, not brand colours.
const SAFETY_RULES = [
  {
    icon: ShieldAlert,
    iconClass: 'text-green-600',
    title: 'Never pay outside the app',
    body: 'All payments must go through Dealmint Escrow. If someone asks you to send money directly to a bank account, it is a scam.',
  },
  {
    icon: MessageSquareDashed,
    iconClass: 'text-blue-600',
    title: 'Keep chats on Dealmint',
    body: 'Scammers will try to move you to WhatsApp or Telegram to avoid our security systems. Keep all communication here.',
  },
  {
    icon: MapPin,
    iconClass: 'text-amber-600',
    title: 'Meet in public',
    body: 'For physical tasks, always meet during daylight hours in busy, public locations like a mall or café. Pick one of our community Safe Spots.',
  },
  {
    icon: UserCheck,
    iconClass: 'text-violet-600',
    title: 'Verify profiles',
    body: 'Always check for the blue verification badge before hiring someone. Verified users have passed our ID checks.',
  },
];

const INTRO_SLIDES = [
  {
    headline: 'Meet people who get things done',
    body: 'Dealmint helps you connect with professionals, freelancers, and businesses right in your community.',
  },
  {
    headline: "Say who you're looking for",
    body: "Describe your ideal professional in your own words and we'll match you with the right people.",
  },
  {
    headline: 'Find people near you',
    body: "See who's around, with approximate distance only. Your exact location is never shown.",
  },
  {
    headline: 'Chat, then meet for real',
    body: "Start with an icebreaker, talk when you're ready, and meet in public when it feels right.",
  },
  {
    headline: 'Safe, verified and private',
    body: "Verification, scam alerts and easy reporting keep Dealmint real. You're always in control.",
  },
];

const TOTAL_SLIDES = INTRO_SLIDES.length;

export function OnboardingPage() {
  usePageTitle('Welcome to Dealmint');
  const navigate = useNavigate();
  const { user } = useApp();

  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalShown, setModalShown] = useState(false);
  const [openRule, setOpenRule] = useState<number | null>(0);
  const [agreed, setAgreed] = useState(false);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const go = (index: number) => {
    if (animating || index < 0 || index >= TOTAL_SLIDES) return;
    setAnimating(true);
    setSlide(index);
    setTimeout(() => setAnimating(false), 350);
  };

  const openModal = () => {
    setModalOpen(true);
    requestAnimationFrame(() => setModalShown(true));
  };

  const closeModal = () => {
    setModalShown(false);
    setTimeout(() => setModalOpen(false), 300);
  };

  const accept = () => {
    if (!agreed) {
      toast.error('Please agree to the Terms of Service to continue.');
      return;
    }
    navigate('/register');
  };

  return (
    <div className="fixed inset-0 z-[80] overflow-hidden bg-gradient-to-b from-[#F3F0FF] to-white select-none">
      {/* Intro carousel */}
      <main className="h-full w-full pt-10 overflow-hidden relative">
        <div
          className="flex h-full w-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${slide * 100}%)` }}
          onTouchStart={(e) => {
            touchStartX.current = e.changedTouches[0].screenX;
          }}
          onTouchEnd={(e) => {
            const diff = touchStartX.current - e.changedTouches[0].screenX;
            if (diff > 50) go(slide + 1);
            if (diff < -50) go(slide - 1);
          }}
        >
          {/* Slide 1 */}
          <div className="min-w-full h-full flex flex-col items-center justify-center px-6 pb-32 relative">
            <div className="relative w-full max-w-sm h-72 mb-8">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400"
                alt="Dealmint professional"
                className="absolute top-0 right-4 w-40 h-52 object-cover rounded-full shadow-lg shadow-black/10 border-4 border-white z-10"
              />
              <img
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=200"
                alt="Dealmint member"
                className="absolute top-12 left-4 w-24 h-24 object-cover rounded-full shadow-lg shadow-black/10 border-4 border-white z-20"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-24 h-24 z-30">
                <img
                  src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200"
                  alt="Dealmint tasker"
                  className="w-full h-full object-cover"
                  style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}
                />
              </div>
              <Heart className="absolute top-4 left-12 w-6 h-6 text-violet-500 fill-violet-500 rotate-[-15deg]" />
              <Heart className="absolute bottom-16 right-8 w-5 h-5 text-violet-500 fill-violet-500 rotate-[15deg]" />
            </div>
            <SlideText index={0} />
          </div>

          {/* Slide 2 */}
          <div className="min-w-full h-full flex flex-col items-center justify-center px-6 pb-32 relative">
            <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-xl border border-gray-100 mb-12">
              <p className="text-violet-500 font-bold text-sm mb-2">You're looking for...</p>
              <p className="text-slate-800 text-lg">A reliable graphic designer</p>
            </div>
            <SlideText index={1} />
          </div>

          {/* Slide 3 */}
          <div className="min-w-full h-full flex flex-col items-center justify-center px-6 pb-32 relative">
            <div className="relative w-64 h-64 border-2 border-gray-100 rounded-full flex items-center justify-center mb-12">
              <div className="absolute w-40 h-40 border border-gray-100 rounded-full" />
              <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center z-10 shadow-sm">
                <div className="w-3 h-3 bg-violet-500 rounded-full" />
              </div>
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100"
                alt="Nearby user"
                className="absolute top-0 w-12 h-12 rounded-full shadow-lg shadow-black/10 border-4 border-white"
              />
              <span className="absolute top-3 right-12 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">2 km</span>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"
                alt="Nearby user"
                className="absolute bottom-8 right-0 w-14 h-14 rounded-full shadow-lg shadow-black/10 border-4 border-white"
              />
              <span className="absolute bottom-14 right-12 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">6 km</span>
              <img
                src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100"
                alt="Nearby user"
                className="absolute bottom-4 left-4 w-12 h-12 rounded-full shadow-lg shadow-black/10 border-4 border-white"
              />
              <img
                src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=100"
                alt="Nearby user"
                className="absolute top-12 left-0 w-10 h-10 rounded-full shadow-lg shadow-black/10 border-4 border-white"
              />
            </div>
            <SlideText index={2} />
          </div>

          {/* Slide 4 */}
          <div className="min-w-full h-full flex flex-col items-center justify-center px-6 pb-32 relative">
            <div className="relative mb-12 flex flex-col items-center">
              <div className="flex -space-x-4 mb-4">
                <img
                  src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150"
                  alt="Dealmint member"
                  className="w-20 h-20 rounded-full shadow-lg shadow-black/10 border-4 border-white z-10"
                />
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
                  alt="Dealmint member"
                  className="w-20 h-20 rounded-full shadow-lg shadow-black/10 border-4 border-white"
                />
              </div>
              <div className="absolute top-12 bg-violet-500 p-2 rounded-full border-4 border-white z-20 shadow-md">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-100 mt-2">
                <p className="text-sm text-slate-700">Hey! I'm just 2 km away and free today.</p>
              </div>
            </div>
            <SlideText index={3} />
          </div>

          {/* Slide 5 */}
          <div className="min-w-full h-full flex flex-col items-center justify-center px-6 pb-32 relative">
            <div className="w-full max-w-xs flex flex-col items-center mb-10">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div className="w-full space-y-3">
                <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                  <BadgeCheck className="w-5 h-5 text-violet-500" />
                  <span className="text-sm font-medium text-slate-700">Selfie-verified profiles</span>
                </div>
                <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-violet-500" />
                  <span className="text-sm font-medium text-slate-700">Location checked at sign-up</span>
                </div>
                <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-violet-500" />
                  <span className="text-sm font-medium text-slate-700">Scam alerts and easy reporting</span>
                </div>
              </div>
            </div>
            <SlideText index={4} />
          </div>
        </div>
      </main>

      {/* Bottom action area */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-8 z-50 flex flex-col items-center bg-gradient-to-t from-white via-white to-transparent">
        <div className="flex gap-2 mb-5" role="tablist" aria-label="Intro slides">
          {INTRO_SLIDES.map((_, i) => (
            <div
              key={i}
              role="tab"
              aria-selected={slide === i}
              aria-label={`Slide ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${slide === i ? 'w-6 h-2 bg-violet-500' : 'w-2 h-2 bg-gray-300'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (slide < TOTAL_SLIDES - 1 ? go(slide + 1) : openModal())}
          className={`w-full max-w-sm text-white font-semibold py-4 rounded-2xl shadow-xl transition-all text-lg ${
            slide === TOTAL_SLIDES - 1
              ? 'bg-violet-500 hover:bg-violet-600'
              : 'bg-slate-900 hover:bg-black'
          }`}
        >
          {slide === TOTAL_SLIDES - 1 ? 'Read Safety Rules' : 'Next'}
        </button>
      </div>

      {/* Awareness rules sheet */}
      {modalOpen && (
        <div
          className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center transition-opacity duration-300 ${
            modalShown ? 'opacity-100' : 'opacity-0'
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Before you join Dealmint"
        >
          <div
            className={`bg-white w-full max-w-md rounded-t-[2rem] p-6 pb-8 relative h-[85dvh] flex flex-col transition-transform duration-300 ease-out ${
              modalShown ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Before you join
                <br />
                Dealmint
              </h2>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Close safety rules"
                className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-500 text-sm mb-6 shrink-0">
              A few things to know so you feel safe and in control.
            </p>

            <div className="flex-grow overflow-y-auto no-scrollbar space-y-3 pb-4">
              {SAFETY_RULES.map((rule, i) => (
                <div key={rule.title} className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setOpenRule(openRule === i ? null : i)}
                    aria-expanded={openRule === i}
                    className="w-full flex items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <rule.icon className={`w-5 h-5 ${rule.iconClass}`} />
                      <span className="font-semibold text-gray-900 text-sm">{rule.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${openRule === i ? 'rotate-180' : ''}`}
                    />
                  </button>
                  <div
                    className={`px-4 text-sm text-gray-500 transition-all duration-300 ${
                      openRule === i ? 'max-h-48 pb-4' : 'max-h-0 overflow-hidden'
                    }`}
                  >
                    {rule.body}
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 pt-4 border-t border-gray-100 bg-white mt-auto">
              <label className="flex items-start gap-3 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-violet-500 focus:ring-violet-500 cursor-pointer accent-violet-500"
                />
                <span className="text-xs text-gray-600 leading-snug">
                  I agree to the{' '}
                  <button type="button" onClick={() => navigate('/terms')} className="text-violet-500 font-semibold hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button type="button" onClick={() => navigate('/safety')} className="text-violet-500 font-semibold hover:underline">
                    Safety Guidelines
                  </button>
                  .
                </span>
              </label>

              <button
                type="button"
                onClick={accept}
                className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-4 rounded-xl shadow-xl transition-all text-lg"
              >
                Accept &amp; Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlideText({ index }: { index: number }) {
  const s = INTRO_SLIDES[index];
  return (
    <div className="text-center max-w-xs">
      <h1 className="font-display text-4xl font-bold text-slate-900 mb-4 uppercase leading-tight">{s.headline}</h1>
      <p className="text-slate-500 text-sm leading-relaxed">{s.body}</p>
    </div>
  );
}
