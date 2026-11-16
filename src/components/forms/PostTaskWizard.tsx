import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  ChevronDown,
  MapPin,
  Wallet,
  TrendingUp,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Package,
  ShieldCheck,
  FileText,
  MapPinned,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { subcategoryByType } from '@/lib/categories';
import { formatPrice } from '@/lib/format';
import { usePageTitle } from '@/hooks/usePageTitle';

/**
 * Post a Task wizard (mock 63ce37): three steps, Details then Budget then
 * Review, inside the mock's card shell with the numbered step indicator.
 */

const STEPS = ['Details', 'Budget', 'Review'] as const;

export function PostTaskWizard() {
  usePageTitle('Post a New Task');
  const navigate = useNavigate();
  const { user, addListing } = useApp();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    budgetType: 'fixed',
    budget: '',
    deadline: 'Within 2 Hours',
  });

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const labelClass = 'text-sm font-semibold text-gray-700 dark:text-gray-200';
  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3.5 font-medium text-gray-900 shadow-sm outline-none transition focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:border-violet-600 dark:bg-violet-800 dark:text-white';

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (form.title.trim().length < 10) e.title = 'Give it a clear title of at least 10 characters';
      if (form.title.trim().length > 90) e.title = 'Keep the title under 90 characters';
      if (!form.category) e.category = 'Choose a category';
      if (form.description.trim().length < 30)
        e.description = 'Add at least 30 characters so doers know what to expect';
      if (!form.location.trim()) e.location = 'Add the pickup address';
    }
    if (s === 1) {
      const price = Number(form.budget);
      if (!form.budget || !Number.isFinite(price) || price < 500)
        e.budget = 'Enter a budget of at least ₦500';
      if (price > 100000000) e.budget = 'That amount looks too high';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!user) return;
    if (!user.phoneVerified) {
      toast.info('Verify your phone number before posting');
      navigate('/verify-phone', { state: { from: '/post/task' } });
      return;
    }
    if (!validateStep(step)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    if (step < 2) {
      setStep(step + 1);
      window.scrollTo({ top: 0 });
      return;
    }
    // Step 3: publish
    setSubmitting(true);
    setTimeout(() => {
      const created = addListing({
        title: form.title.trim(),
        description: form.description.trim(),
        type: 'task',
        category: form.category,
        price: Math.round(Number(form.budget) || 0),
        priceType: form.budgetType === 'hourly' ? 'hourly' : 'fixed',
        location: form.location.trim(),
        isRemote: false,
        images: ['/images/category_tasks.jpg'],
        tags: [form.category.toLowerCase()],
        deadline: new Date().toISOString().slice(0, 10),
        isDraft: false,
        isActive: true,
      });
      if (!created) {
        toast.error('Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      toast.success('Task posted successfully!');
      setSubmitting(false);
      navigate('/dashboard/listings');
    }, 600);
  };

  const fieldError = (k: string) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
        {errors[k]}
      </p>
    ) : null;

  const summaryRow = (icon: React.ReactNode, label: string, value: string) => (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-violet-700 last:border-0">
      <span className="mt-0.5 text-gray-400 dark:text-gray-500">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-white break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-lavender pt-20 lg:pt-24 dark:bg-violet-950">
      <div className="mx-auto max-w-md px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-violet-900/5 dark:border-violet-700 dark:bg-violet-900">
          {/* Header: close, title, drafts (mock header) */}
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-violet-700">
            <button
              type="button"
              onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
              aria-label={step === 0 ? 'Close' : 'Back'}
              className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-violet-800"
            >
              {step === 0 ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </button>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Post a New Task</h1>
            <Link to="/dashboard/listings" className="text-sm font-semibold text-violet-600 dark:text-amber-400">
              Drafts
            </Link>
          </header>

          <div className="space-y-6 p-5">
            {/* Step indicator (mock: numbered circles + connector lines) */}
            <div className="flex items-center justify-between px-2 pt-1">
              {STEPS.map((label, i) => (
                <div key={label} className="contents">
                  {i > 0 && (
                    <div className={`mx-2 h-0.5 flex-grow ${i <= step ? 'bg-purple-600' : 'bg-gray-200 dark:bg-violet-700'}`} />
                  )}
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        i < step
                          ? 'bg-green-500 text-white shadow-md shadow-green-500/30'
                          : i === step
                            ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                            : 'border-2 border-gray-200 bg-white text-gray-400 dark:border-violet-600 dark:bg-violet-800 dark:text-gray-500'
                      }`}
                    >
                      {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span
                      className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${
                        i === step ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* STEP 1: Details */}
            {step === 0 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="title" className={labelClass}>
                    What do you need done?
                  </label>
                  <input
                    id="title"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    maxLength={90}
                    placeholder="e.g. Deliver a package to Ikeja"
                    className={inputClass}
                  />
                  {fieldError('title')}
                </div>

                <div className="space-y-2">
                  <label htmlFor="category" className={labelClass}>
                    Category
                  </label>
                  <div className="relative">
                    <select
                      id="category"
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className={`${inputClass} cursor-pointer appearance-none pr-11`}
                    >
                      <option value="">Select a category...</option>
                      {subcategoryByType.task.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                  {fieldError('category')}
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className={`${labelClass} flex justify-between`}>
                    <span>Description</span>
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                      {form.description.length}/500
                    </span>
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    maxLength={500}
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Provide specific details. What is being delivered? Where is the pickup and drop-off? Are there any special instructions?"
                    className={`${inputClass} resize-none p-4 text-sm`}
                  />
                  {fieldError('description')}
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className={labelClass}>
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      id="location"
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      placeholder="Pickup address"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                  {fieldError('location')}
                </div>
              </div>
            )}

            {/* STEP 2: Budget */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <span className={labelClass}>Budget Type</span>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: 'fixed', label: 'Fixed Price', icon: Wallet, on: 'border-purple-600 bg-purple-50 dark:border-purple-400 dark:bg-purple-500/10', onText: 'text-purple-700 dark:text-purple-300', onIcon: 'text-purple-600 dark:text-purple-300' },
                      { v: 'hourly', label: 'Hourly Rate', icon: TrendingUp, on: 'border-purple-600 bg-purple-50 dark:border-purple-400 dark:bg-purple-500/10', onText: 'text-purple-700 dark:text-purple-300', onIcon: 'text-purple-600 dark:text-purple-300' },
                    ].map((b) => {
                      const active = form.budgetType === b.v;
                      return (
                        <button
                          key={b.v}
                          type="button"
                          onClick={() => set('budgetType', b.v)}
                          aria-pressed={active}
                          className={`flex flex-col items-center justify-center rounded-xl border-2 py-3 transition ${
                            active
                              ? `${b.on} `
                              : 'border-gray-200 bg-white hover:border-purple-300 dark:border-violet-600 dark:bg-violet-800 dark:hover:border-violet-500'
                          }`}
                        >
                          <b.icon className={`mb-1 h-5 w-5 ${active ? b.onIcon : 'text-gray-400'}`} />
                          <span className={`text-sm font-bold ${active ? b.onText : 'text-gray-600 dark:text-gray-300'}`}>
                            {b.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="budget" className={labelClass}>
                    What is your budget?
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 dark:text-gray-400">₦</span>
                    <input
                      id="budget"
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={form.budget}
                      onChange={(e) => set('budget', e.target.value)}
                      placeholder="0.00"
                      className={`${inputClass} py-3.5 pl-9 text-lg font-bold`}
                    />
                  </div>
                  {fieldError('budget')}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Tip: Tasks with clear budgets get 3x more applicants.
                  </p>
                </div>

                <div className="flex gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3 dark:border-orange-500/20 dark:bg-orange-500/10">
                  <Clock className="h-5 w-5 shrink-0 text-orange-600 dark:text-orange-300" />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="deadline" className="mb-1 block text-xs font-bold text-orange-800 dark:text-orange-300">
                      Urgent Deadline
                    </label>
                    <select
                      id="deadline"
                      value={form.deadline}
                      onChange={(e) => set('deadline', e.target.value)}
                      className="w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-orange-500 dark:border-violet-600 dark:bg-violet-800 dark:text-white"
                    >
                      <option>Within 2 Hours</option>
                      <option>Today</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Review */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-violet-700 dark:bg-violet-800">
                  {summaryRow(<FileText className="h-4 w-4" />, 'Task', form.title)}
                  {summaryRow(<Package className="h-4 w-4" />, 'Category', form.category)}
                  {summaryRow(<FileText className="h-4 w-4" />, 'Description', form.description)}
                  {summaryRow(<MapPinned className="h-4 w-4" />, 'Pickup', form.location)}
                  {summaryRow(
                    <Banknote className="h-4 w-4" />,
                    'Budget',
                    `${formatPrice(Number(form.budget))}${form.budgetType === 'hourly' ? ' per hour' : ''}`
                  )}
                  {summaryRow(<Clock className="h-4 w-4" />, 'Needed', form.deadline.toLowerCase())}
                </div>
                <div className="flex items-start gap-2.5 rounded-xl bg-green-50 p-3.5 dark:bg-green-900/20">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-300" />
                  <p className="text-xs leading-relaxed text-green-800 dark:text-green-200">
                    Doers will apply with their own offer. Their payment is held safely in escrow and
                    released to you only when you confirm the task is done.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sticky bottom action (mock footer) */}
          <div className="border-t border-gray-100 bg-white p-4 pb-6 dark:border-violet-700 dark:bg-violet-900">
            <button
              type="button"
              onClick={next}
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 text-lg font-bold text-white shadow-lg shadow-purple-600/30 transition-all hover:bg-purple-700 disabled:opacity-60"
            >
              {step === 0 && (
                <>
                  Continue to Budget <ArrowRight className="h-5 w-5" />
                </>
              )}
              {step === 1 && (
                <>
                  Continue to Review <ArrowRight className="h-5 w-5" />
                </>
              )}
              {step === 2 && (submitting ? 'Posting...' : 'Post Task')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
