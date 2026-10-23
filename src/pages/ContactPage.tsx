import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { isValidEmail } from '@/lib/validation';
import { usePageTitle } from '@/hooks/usePageTitle';

export function ContactPage() {
  usePageTitle('Contact');
  const { user } = useApp();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    if (user) {
      setFormData((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email }));
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (formData.name.trim().length < 2) return void toast.error('Please enter your name');
    if (!isValidEmail(formData.email)) return void toast.error('Please enter a valid email address');
    if (formData.subject.trim().length < 3) return void toast.error('Please add a subject');
    if (formData.message.trim().length < 10) return void toast.error('Your message is a little short. Add a few more details.');
    setSending(true);
    setTimeout(() => {
      try {
        const key = 'dealmint_contact_messages';
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        localStorage.setItem(key, JSON.stringify([...existing, { ...formData, at: new Date().toISOString() }]));
      } catch {
        // storage unavailable, the confirmation is still shown
      }
      setSending(false);
      setSent(true);
      toast.success('Message sent! We will get back to you soon.');
      setFormData({ name: user?.name || '', email: user?.email || '', subject: '', message: '' });
    }, 700);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email',
      value: 'support@dealmint.ng',
      href: 'mailto:support@dealmint.ng',
    },
    {
      icon: Phone,
      title: 'Phone',
      value: '+234 800 123 4567',
      href: 'tel:+2348001234567',
    },
    {
      icon: MapPin,
      title: 'Office',
      value: 'Lagos, Nigeria',
      href: 'https://www.google.com/maps/search/?api=1&query=Lagos%2C+Nigeria',
    },
  ];

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="font-display font-bold text-3xl lg:text-5xl text-gray-900 dark:text-white mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Have a question or need help? We're here for you. Reach out to our team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {contactInfo.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 flex items-start gap-4 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-700 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-6 h-6 text-violet-600 dark:text-violet-300" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">{item.value}</p>
                </div>
              </a>
            ))}

            {/* Support Hours */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="w-6 h-6 text-amber-500" />
                <h3 className="font-display font-semibold text-gray-900 dark:text-white">
                  Support Hours
                </h3>
              </div>
              <div className="space-y-2 text-gray-600 dark:text-gray-300">
                <p>Monday - Friday: 8am - 8pm</p>
                <p>Saturday: 9am - 5pm</p>
                <p>Sunday: 10am - 4pm</p>
                <p className="text-sm text-violet-600 dark:text-amber-400 mt-4">
                  24/7 emergency support available
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-8">
              <h2 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-6">
                Send us a Message
              </h2>
              {sent && (
                <div role="status" className="mb-6 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 text-green-800 dark:text-green-200 text-sm">
                  Thanks for reaching out. Your message has been received and our team replies within one business day.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      required
                      className="dark:bg-violet-700 dark:border-violet-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="john@example.com"
                      required
                      className="dark:bg-violet-700 dark:border-violet-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Subject
                  </label>
                  <Input
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                    placeholder="How can we help?"
                    required
                    className="dark:bg-violet-700 dark:border-violet-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Tell us more about your inquiry..."
                    rows={6}
                    required
                    className="dark:bg-violet-700 dark:border-violet-600"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
