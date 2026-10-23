import { usePageTitle } from '@/hooks/usePageTitle';
import { Shield, Lock, Phone, Headphones, AlertTriangle, CheckCircle } from 'lucide-react';
import { safetyFeatures } from '@/data/mockData';

export function SafetyCenterPage() {
  usePageTitle('Safety Center');
  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-violet-600 mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-display font-bold text-3xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            Safety Center
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Your safety is our priority. Learn about the measures we take to keep our community secure.
          </p>
        </div>

        {/* Safety Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {safetyFeatures.map((feature) => {
            const icons: Record<string, React.ElementType> = {
              Shield,
              Lock,
              Phone,
              HeadphonesIcon: Headphones,
            };
            const Icon = icons[feature.icon] || Shield;
            return (
              <div
                key={feature.title}
                className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 lg:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-violet-600 dark:text-violet-300" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Tips */}
        <div className="bg-white dark:bg-violet-800 rounded-2xl p-8 lg:p-12 mb-8 border border-gray-200 dark:border-violet-700">
          <h2 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-8">
            Safety Tips
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Do's
              </h3>
              <ul className="space-y-3">
                {[
                  'Verify profiles before booking',
                  'Use our in-app chat for communication',
                  'Meet in public places when possible',
                  'Share your location with trusted contacts',
                  'Report suspicious behavior immediately',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <span className="text-green-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Don'ts
              </h3>
              <ul className="space-y-3">
                {[
                  'Share personal financial information',
                  'Pay outside the platform',
                  'Meet in isolated or unsafe locations',
                  'Ignore your instincts if something feels off',
                  'Share your login credentials with anyone',
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-gray-600 dark:text-gray-300">
                    <span className="text-amber-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-violet-600 rounded-2xl p-8 lg:p-12 text-center">
          <h2 className="font-display font-bold text-2xl text-white mb-4">
            Need Help?
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            Our support team is available 24/7 to assist you with any safety concerns.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+2348001234567"
              className="inline-flex items-center gap-2 bg-white text-violet-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Phone className="w-5 h-5" />
              +234 800 123 4567
            </a>
            <a
              href="mailto:safety@dealmint.ng"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Contact Safety Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
