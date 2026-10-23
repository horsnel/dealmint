import { usePageTitle } from '@/hooks/usePageTitle';
import { Link } from 'react-router-dom';
import { Search, MessageSquare, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { howItWorksSteps } from '@/data/mockData';

export function HowItWorksPage() {
  usePageTitle('How it Works');
  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display font-bold text-3xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            How Dealmint Works
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Get things done in three simple steps. Whether you're hiring help or offering your skills, we've made it easy.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 mb-16">
          {howItWorksSteps.map((step, index) => {
            const icons = [Search, MessageSquare, Star];
            const Icon = icons[index];
            return (
              <div
                key={step.number}
                className="relative text-center lg:text-left"
              >
                {/* Connector Line */}
                {index < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-violet-200 dark:bg-violet-700 -translate-x-1/2" />
                )}

                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-violet-600 mb-6">
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-6xl font-display font-black text-violet-200 dark:text-violet-800 mb-4">
                  {step.number}
                </div>
                <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* For Requesters */}
        <div className="bg-white dark:bg-violet-800 rounded-2xl p-8 lg:p-12 mb-8 border border-gray-200 dark:border-violet-700">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-4">
                Looking to Get Things Done?
              </h2>
              <ul className="space-y-4 mb-6">
                {[
                  'Post a request with your budget',
                  'Receive offers from qualified doers',
                  'Compare profiles and reviews',
                  'Book with confidence - payments are protected',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/post/task"
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-3 rounded-full transition-colors"
              >
                Post a Request
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="hidden lg:block">
              <img
                src="/images/delivery_handoff.jpg"
                alt="Get things done"
                className="rounded-xl w-full h-80 object-cover"
              />
            </div>
          </div>
        </div>

        {/* For Doers */}
        <div className="bg-violet-600 rounded-2xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1 hidden lg:block">
              <img
                src="/images/creative_work.jpg"
                alt="Offer your skills"
                className="rounded-xl w-full h-80 object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="font-display font-bold text-2xl lg:text-3xl text-white mb-4">
                Ready to Earn?
              </h2>
              <ul className="space-y-4 mb-6">
                {[
                  'Create a listing showcasing your skills',
                  'Set your own prices and schedule',
                  'Get discovered by people who need you',
                  'Get paid securely through our platform',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/post/gig"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
              >
                Post a Gig
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
