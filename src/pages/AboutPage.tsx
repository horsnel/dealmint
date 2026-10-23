import { usePageTitle } from '@/hooks/usePageTitle';
import { Target, Eye, Heart, Users, TrendingUp, Globe } from 'lucide-react';
import { platformStats } from '@/data/mockData';

export function AboutPage() {
  usePageTitle('About');
  const values = [
    {
      icon: Heart,
      title: 'Community First',
      description: 'We believe in building a supportive community where everyone can thrive.',
    },
    {
      icon: Target,
      title: 'Trust & Safety',
      description: 'Your safety is our top priority. We verify every member of our community.',
    },
    {
      icon: TrendingUp,
      title: 'Economic Growth',
      description: 'We empower Nigerians to earn and grow their businesses.',
    },
    {
      icon: Globe,
      title: 'Accessibility',
      description: 'Making quality services accessible to everyone, everywhere.',
    },
  ];

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="font-display font-bold text-3xl lg:text-5xl text-gray-900 dark:text-white mb-6">
            About Dealmint
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-3xl mx-auto leading-relaxed">
            Dealmint is Nigeria's premier marketplace connecting skilled individuals 
            with people who need their services. We're on a mission to make it easy 
            for anyone to find help or earn money doing what they love.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Users', value: platformStats.totalUsers.toLocaleString() },
            { label: 'Listings', value: platformStats.totalListings.toLocaleString() },
            { label: 'Orders Completed', value: platformStats.completedOrders.toLocaleString() },
            { label: 'Average Rating', value: `${platformStats.averageRating}/5` },
          ].map((stat) => (
            <div
              key={stat.label}
              className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 text-center"
            >
              <div className="text-3xl lg:text-4xl font-display font-bold text-violet-600 dark:text-amber-400 mb-2">
                {stat.value}
              </div>
              <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center">
                <Target className="w-6 h-6 text-violet-600 dark:text-violet-300" />
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                Our Mission
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              To empower every Nigerian with the opportunity to earn and access 
              quality services, creating a thriving ecosystem of skilled professionals 
              and satisfied customers.
            </p>
          </div>

          <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center">
                <Eye className="w-6 h-6 text-violet-600 dark:text-violet-300" />
              </div>
              <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                Our Vision
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              To become Africa's most trusted platform for connecting talent with 
              opportunity, driving economic growth and transforming how work gets done.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white text-center mb-8">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="card-white dark:bg-violet-800 dark:border-violet-700 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                    <value.icon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white mb-2">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {value.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team CTA */}
        <div className="bg-violet-600 rounded-2xl p-8 lg:p-12 text-center">
          <Users className="w-16 h-16 text-white/80 mx-auto mb-6" />
          <h2 className="font-display font-bold text-2xl lg:text-3xl text-white mb-4">
            Join Our Team
          </h2>
          <p className="text-white/80 mb-6 max-w-xl mx-auto">
            We're always looking for talented individuals who are passionate about 
            building the future of work in Africa.
          </p>
          <a
            href="mailto:careers@dealmint.ng"
            className="inline-flex items-center gap-2 bg-white text-violet-600 font-semibold px-6 py-3 rounded-full hover:bg-gray-100 transition-colors"
          >
            View Open Positions
          </a>
        </div>
      </div>
    </div>
  );
}
