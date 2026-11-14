import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MODES, stageIntents } from '@/lib/modes';
import type { ProviderMode } from '@/types';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Multi-select onboarding: "What brings you to Dealmint?"
 *
 * Modes are a personalization preference, not identities — users pick all
 * that apply (or skip), and can change them anytime in Settings. The student
 * question stays here because it carries the lower 10% commission perk.
 * Picks are staged to localStorage and adopted by whichever signup flow
 * completes (email/password, Google, magic link).
 */
export function RoleSelectionPage() {
  usePageTitle('Get started');
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ProviderMode[]>([]);
  const [isStudent, setIsStudent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = (id: ProviderMode) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const handleContinue = () => {
    setIsLoading(true);
    stageIntents(selected);
    localStorage.setItem('dealmint_selected_role', isStudent ? 'student' : 'general');
    navigate('/register');
    setIsLoading(false);
  };

  const handleSkip = () => {
    stageIntents([]);
    localStorage.setItem('dealmint_selected_role', 'general');
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 lg:py-16">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-gray-900 dark:text-white mb-4">
            What brings you to Dealmint?
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-xl mx-auto">
            Select all that apply. It personalizes your dashboard. You can change this anytime in
            Settings, and you can always buy, sell and hire either way.
          </p>
        </div>

        {/* Mode Cards — multi-select */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {MODES.map((mode) => {
            const active = selected.includes(mode.id);
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => toggleMode(mode.id)}
                aria-pressed={active}
                className={`relative text-left p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                  active
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-800/60'
                    : 'border-gray-200 dark:border-violet-700 bg-white dark:bg-violet-800 hover:border-violet-300 dark:hover:border-violet-600'
                }`}
              >
                {/* Selection Indicator */}
                <div
                  aria-hidden="true"
                  className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                    active ? 'bg-violet-600' : 'border-2 border-gray-200 dark:border-violet-600'
                  }`}
                >
                  {active && <Check className="w-4 h-4 text-white" />}
                </div>

                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                    active ? 'bg-violet-600 text-white' : `${mode.bubble} ${mode.bubbleDark}`
                  }`}
                >
                  <mode.icon className="w-6 h-6" />
                </div>
                <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
                  {mode.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {mode.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Student perk */}
        <button
          type="button"
          onClick={() => setIsStudent((v) => !v)}
          aria-pressed={isStudent}
          className={`relative w-full text-left p-5 rounded-2xl border-2 transition-all active:scale-[0.99] ${
            isStudent
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
              : 'border-gray-200 dark:border-violet-700 bg-white dark:bg-violet-800 hover:border-amber-300 dark:hover:border-amber-500/60'
          }`}
        >
          <div
            aria-hidden="true"
            className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              isStudent ? 'bg-amber-500' : 'border-2 border-gray-200 dark:border-violet-600'
            }`}
          >
            {isStudent && <Check className="w-4 h-4 text-white" />}
          </div>
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                isStudent
                  ? 'bg-amber-500 text-white'
                  : 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
              }`}
            >
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
                I'm a student
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Students pay a lower 10% commission on earnings. We may ask for a school email to
                verify later.
              </p>
            </div>
          </div>
        </button>

        {/* Continue */}
        <div className="text-center mt-10">
          <Button
            onClick={handleContinue}
            disabled={isLoading}
            className="bg-violet-600 hover:bg-violet-700 px-8 py-3 text-lg"
          >
            {isLoading ? 'Please wait...' : 'Continue'}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            className="block mx-auto mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:underline"
          >
            Skip for now
          </button>
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
