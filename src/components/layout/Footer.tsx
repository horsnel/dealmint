import { Link } from 'react-router-dom';
import { Logo } from '@/components/common/Logo';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';

export function Footer() {
  const footerLinks = {
    product: [
      { name: 'Browse', href: '/browse' },
      { name: 'Post a Gig', href: '/post/gig' },
      { name: 'Post a Task', href: '/post/task' },
      { name: 'How it Works', href: '/how-it-works' },
      { name: 'Pricing', href: '/#pricing' },
    ],
    company: [
      { name: 'About', href: '/about' },
      { name: 'Careers', href: '/careers' },
      { name: 'Blog', href: '/blog' },
      { name: 'Press', href: '/press' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'Safety', href: '/safety' },
      { name: 'Contact', href: '/contact' },
      { name: 'Community', href: '/community' },
    ],
    legal: [
      { name: 'Privacy', href: '/privacy' },
      { name: 'Terms', href: '/terms' },
      { name: 'Cookies', href: '/cookies' },
    ],
  };

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
  ];

  return (
    <footer className="bg-lavender dark:bg-violet-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Logo size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              Find it. Post it. Done. Dealmint connects doers and requesters, fast, safe, and local.
            </p>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Mail className="w-4 h-4 text-violet-600 dark:text-amber-400" />
                <span>support@dealmint.ng</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <Phone className="w-4 h-4 text-violet-600 dark:text-amber-400" />
                <span>+234 800 123 4567</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-violet-600 dark:text-amber-400" />
                <span>Lagos, Nigeria</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center text-violet-600 dark:text-gray-300 hover:bg-violet-200 dark:hover:bg-violet-700 transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">
              Product
            </h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="inline-block py-1.5 -my-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">
              Company
            </h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="inline-block py-1.5 -my-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">
              Support
            </h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="inline-block py-1.5 -my-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="inline-block py-1.5 -my-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-amber-400 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-violet-200 dark:border-violet-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Dealmint. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                product of <strong className="font-bold text-gray-700 dark:text-gray-200">O.L.H.M.E.S</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
