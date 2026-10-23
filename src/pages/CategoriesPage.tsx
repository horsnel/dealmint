import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, ClipboardList, Laptop, Users, Download } from 'lucide-react';
import { categories } from '@/data/mockData';
import { useApp } from '@/context/AppContext';
import { matchesCategory } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';

const iconMap: Record<string, React.ElementType> = {
  Briefcase,
  ClipboardList,
  Laptop,
  Users,
  Download,
};

export function CategoriesPage() {
  usePageTitle('Categories');
  const { listings } = useApp();
  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h1 className="font-display font-bold text-3xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            Browse by Category
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Find exactly what you need across our diverse range of categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {categories.map((category) => {
            const Icon = iconMap[category.icon] || Briefcase;
            return (
              <Link
                key={category.id}
                to={`/browse?category=${category.slug}`}
                className="group card-white dark:bg-violet-800 dark:border-violet-700 overflow-hidden hover:shadow-lg transition-all"
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-white text-xl">
                          {category.name}
                        </h3>
                        <p className="text-white/80 text-sm">
                          {listings.filter((l) => matchesCategory(l, category.slug)).length.toLocaleString()} listings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {category.description}
                  </p>

                  {/* Subcategories */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {category.subcategories.slice(0, 4).map((sub) => (
                      <span
                        key={sub}
                        className="text-xs px-3 py-1 bg-violet-100 dark:bg-violet-700 text-violet-700 dark:text-violet-200 rounded-full"
                      >
                        {sub}
                      </span>
                    ))}
                    {category.subcategories.length > 4 && (
                      <span className="text-xs px-3 py-1 bg-gray-100 dark:bg-violet-700 text-gray-600 dark:text-violet-300 rounded-full">
                        +{category.subcategories.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center text-violet-600 dark:text-amber-400 font-medium group-hover:gap-3 transition-all">
                    <span>Browse {category.name}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-violet-600 rounded-2xl p-8 lg:p-12">
            <h2 className="font-display font-bold text-2xl lg:text-3xl text-white mb-4">
              Can't find what you're looking for?
            </h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Post a request and let qualified doers come to you with their offers.
            </p>
            <Link
              to="/post/task"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Post a Request
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
