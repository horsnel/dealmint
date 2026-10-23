import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Briefcase, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function RoleSelectionPage() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'student' | 'general' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }

    setIsLoading(true);

    // Store selected role and redirect to registration
    setTimeout(() => {
      localStorage.setItem('dealmint_selected_role', selectedRole);
      toast.success(`Selected: ${selectedRole === 'student' ? 'Student' : 'General User'}`);
      navigate('/register');
      setIsLoading(false);
    }, 500);
  };

  const roles = [
    {
      id: 'student' as const,
      title: 'Student',
      description: 'I want to earn while studying',
      icon: GraduationCap,
      benefits: [
        'Lower 10% commission fee',
        'Flexible schedule',
        'Build your portfolio',
        'Student-exclusive opportunities',
      ],
    },
    {
      id: 'general' as const,
      title: 'General User',
      description: 'I want to offer professional services',
      icon: Briefcase,
      benefits: [
        'Full platform access',
        'Professional tools',
        'Higher earning potential',
        'Business growth features',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-gray-900 dark:text-white mb-4">
            How will you use Dealmint?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-xl mx-auto">
            Choose the option that best describes you. This helps us personalize your experience.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`relative text-left p-6 lg:p-8 rounded-2xl border-2 transition-all ${
                selectedRole === role.id
                  ? 'border-violet-600 bg-violet-50 dark:bg-violet-800/50'
                  : 'border-gray-200 dark:border-violet-700 bg-white dark:bg-violet-800 hover:border-violet-300 dark:hover:border-violet-600'
              }`}
            >
              {/* Selection Indicator */}
              {selectedRole === role.id && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-violet-600 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                  selectedRole === role.id
                    ? 'bg-violet-600'
                    : 'bg-violet-100 dark:bg-violet-700'
                }`}>
                  <role.icon className={`w-7 h-7 ${
                    selectedRole === role.id
                      ? 'text-white'
                      : 'text-violet-600 dark:text-violet-300'
                  }`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-gray-900 dark:text-white">
                    {role.title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {role.description}
                  </p>
                </div>
              </div>

              <ul className="space-y-2">
                {role.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
                  >
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={isLoading || !selectedRole}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-lg"
          >
            {isLoading ? 'Please wait...' : 'Continue'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Back Link */}
        <p className="text-center mt-8 text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-violet-600 dark:text-amber-400 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
