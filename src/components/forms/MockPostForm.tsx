import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  Layers,
  Toolbox,
  ListTodo,
  UserPlus,
  FileBox,
  ImagePlus,
  FileUp,
  Image as ImageIcon,
  Clock,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { subcategoryByType } from '@/lib/categories';
import { compressImage } from '@/lib/image';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { ListingType } from '@/types';

/**
 * Category-specific post forms (mock b9119e, frames 2 to 6). Each type shows
 * only its own mock fields inside a shared card shell: white header with
 * close / icon title / drafts, labeled fields with a per-type focus ring,
 * and a full width colored publish button in the footer.
 */

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

const defaultImage: Record<ListingType, string> = {
  gig: '/images/category_gigs.jpg',
  task: '/images/category_tasks.jpg',
  job: '/images/category_jobs.jpg',
  service: '/images/category_services.jpg',
  digital: '/images/category_digital.jpg',
};

const THEMES: Record<
  ListingType,
  {
    icon: typeof Layers;
    title: string;
    ring: string;
    btn: string;
    iconColor: string;
    cta: string;
  }
> = {
  gig: {
    icon: Layers,
    title: 'Post a Gig',
    ring: 'focus:ring-violet-500',
    btn: 'bg-violet-600 hover:bg-violet-700 shadow-violet-600/30',
    iconColor: 'text-violet-600 dark:text-violet-300',
    cta: 'Publish Gig',
  },
  service: {
    icon: Toolbox,
    title: 'Offer a Service',
    ring: 'focus:ring-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30',
    iconColor: 'text-blue-600 dark:text-blue-300',
    cta: 'Publish Service',
  },
  task: {
    icon: ListTodo,
    title: 'Post a Task',
    ring: 'focus:ring-orange-500',
    btn: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/30',
    iconColor: 'text-orange-600 dark:text-orange-300',
    cta: 'Post Task Now',
  },
  job: {
    icon: UserPlus,
    title: 'Post a Job',
    ring: 'focus:ring-green-500',
    btn: 'bg-green-600 hover:bg-green-700 shadow-green-600/30',
    iconColor: 'text-green-600 dark:text-green-300',
    cta: 'Post Job Listing',
  },
  digital: {
    icon: FileBox,
    title: 'Sell Digital',
    ring: 'focus:ring-pink-500',
    btn: 'bg-pink-600 hover:bg-pink-700 shadow-pink-600/30',
    iconColor: 'text-pink-600 dark:text-pink-300',
    cta: 'Publish Product',
  },
};

const selectChevron =
  'pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400';

export function MockPostForm({ type }: { type: ListingType }) {
  const t = THEMES[type];
  usePageTitle(t.title);
  const navigate = useNavigate();
  const { user, addListing } = useApp();

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cover, setCover] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: '',
    deliveryTime: '',
    price: '',
    priceModel: 'fixed',
    location: '',
    isRemote: false,
    deadline: 'Within 2 Hours',
    jobType: 'Full-time',
    salaryPeriod: 'Per Month',
    requirements: '',
  });
  const coverInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const inputClass = `w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm outline-none transition focus:ring-2 dark:border-violet-600 dark:bg-violet-800 dark:text-white ${t.ring}`;
  const labelClass = 'text-sm font-semibold text-gray-700 dark:text-gray-200';

  const pickCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_IMAGE_BYTES) {
      toast.error('Images must be 8 MB or smaller');
      return;
    }
    try {
      setCover(await compressImage(f));
      if (errors.cover) setErrors((er) => ({ ...er, cover: '' }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not use that image');
    }
  };

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_FILE_BYTES) {
      toast.error('Files must be 50 MB or smaller');
      return;
    }
    const ext = f.name.includes('.') ? f.name.split('.').pop()!.toUpperCase() : 'FILE';
    setFile({ name: f.name, size: f.size, type: ext });
    if (errors.file) setErrors((er) => ({ ...er, file: '' }));
  };

  const buildDescription = () => {
    const title = form.title.trim();
    if (type === 'gig')
      return `${title}. Delivered within ${form.deliveryTime.toLowerCase()}. Message me for custom requirements. Payments are protected by Dealmint escrow.`;
    if (type === 'service')
      return `${title}. ${
        form.isRemote ? 'Available remotely.' : form.location.trim() ? `Serving ${form.location.trim()}.` : 'Available locally.'
      } Bookings and payments are protected by Dealmint escrow.`;
    if (type === 'task')
      return `${title}. Needed ${form.deadline === 'Within 2 Hours' ? 'within 2 hours' : 'today'}. ${
        form.location.trim() ? `Pickup at ${form.location.trim()}. ` : ''
      }Payment stays in escrow until the task is confirmed done.`;
    if (type === 'job')
      return `${title}. ${form.jobType} role paying ₦${Number(form.price).toLocaleString()} ${form.salaryPeriod.toLowerCase()}. ${
        form.requirements.trim() || 'Message me for the full role description.'
      }`;
    return `${title}. Instant download after purchase. ${file ? `Provided as ${file.type}. ` : ''}Payments are protected by Dealmint escrow.`;
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 10) e.title = 'Give it a clear title of at least 10 characters';
    if (form.title.trim().length > 90) e.title = 'Keep the title under 90 characters';
    const price = Number(form.price);
    const min = type === 'task' ? 500 : 100;
    if (!form.price || !Number.isFinite(price) || price < min) e.price = `Enter an amount of at least ₦${min}`;
    if (price > 100000000) e.price = 'That amount looks too high';
    if (type === 'gig') {
      if (!form.category) e.category = 'Choose a category';
      if (!form.deliveryTime) e.deliveryTime = 'Choose a delivery time';
    }
    if (type === 'service' && !form.isRemote && !form.location.trim()) e.location = 'Add a location, or tick remote';
    if (type === 'task' && !form.location.trim()) e.location = 'Add the pickup location';
    if (type === 'digital' && !file) e.file = 'Upload the file buyers will receive';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!user) return;
    if (!user.phoneVerified) {
      toast.info('Verify your phone number before posting');
      navigate('/verify-phone', { state: { from: window.location.pathname } });
      return;
    }
    if (!validate()) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const loc = form.location.trim();
      const tags =
        type === 'job'
          ? [form.jobType.toLowerCase().replace(' ', '-')]
          : type === 'gig' && form.category
            ? [form.category.toLowerCase()]
            : [];
      const created = addListing({
        title: form.title.trim(),
        description: buildDescription(),
        type,
        category:
          form.category ||
          (type === 'gig' ? 'Other' : subcategoryByType[type][0]),
        price: Math.round(Number(form.price) || 0),
        priceType:
          type === 'service'
            ? form.priceModel === 'hourly'
              ? 'hourly'
              : 'fixed'
            : type === 'job'
              ? form.salaryPeriod === 'Per Hour'
                ? 'hourly'
                : 'fixed'
              : 'fixed',
        location: loc || undefined,
        isRemote: form.isRemote || !loc || type === 'job' || type === 'digital',
        images: cover ? [cover] : [defaultImage[type]],
        tags,
        deliveryTime:
          type === 'gig'
            ? form.deliveryTime
            : type === 'digital'
              ? 'Instant download'
              : undefined,
        requirements: type === 'job' ? form.requirements.trim() || undefined : undefined,
        deadline: type === 'task' ? new Date().toISOString().slice(0, 10) : undefined,
        fileName: type === 'digital' ? file?.name : undefined,
        fileSize: type === 'digital' ? file?.size : undefined,
        fileType: type === 'digital' ? file?.type : undefined,
        isDraft: false,
        isActive: true,
      });
      if (!created) {
        toast.error('Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }
      toast.success(`${t.cta.replace('Publish ', '').replace('Post ', '').replace(' Now', '')} posted successfully!`);
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

  const SelectWrap = ({ children }: { children: React.ReactNode }) => (
    <div className="relative">
      {children}
      <ChevronDown className={selectChevron} />
    </div>
  );

  return (
    <div className="min-h-screen bg-lavender pt-20 lg:pt-24 dark:bg-violet-950">
      <div className="mx-auto max-w-md px-4 pb-16 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-xl shadow-violet-900/5 dark:border-violet-700 dark:bg-violet-900">
          {/* Header: close, icon title, drafts (mock header) */}
          <header className="flex items-center justify-between border-b border-gray-100 px-4 py-4 dark:border-violet-700">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Close"
              className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-violet-800"
            >
              <X className="h-5 w-5" />
            </button>
            <h1 className="flex items-center gap-2 font-bold text-lg text-gray-900 dark:text-white">
              <t.icon className={`h-4 w-4 ${t.iconColor}`} />
              {t.title}
            </h1>
            <Link
              to="/dashboard/listings"
              className="text-sm font-semibold text-violet-600 dark:text-amber-400"
            >
              Drafts
            </Link>
          </header>

          <form
            id="mock-post-form"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            noValidate
            className="space-y-5 p-5"
          >
            {/* Title (every type) */}
            <div className="space-y-2">
              <label htmlFor="title" className={labelClass}>
                {type === 'task' ? 'What needs to be done?' : type === 'job' ? 'Job Role' : type === 'digital' ? 'Product Title' : type === 'service' ? 'Service Title' : 'Gig Title'}
              </label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={90}
                placeholder={
                  type === 'gig'
                    ? 'I will...'
                    : type === 'task'
                      ? 'e.g. Pick up a package from Yaba'
                      : type === 'service'
                        ? 'e.g. Mobile Barber / Home Cleaning'
                        : type === 'job'
                          ? 'e.g. Remote Customer Support'
                          : 'e.g. Notion Budget Template'
                }
                className={inputClass}
              />
              {fieldError('title')}
            </div>

            {/* Gig: category + delivery time side by side */}
            {type === 'gig' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="category" className={labelClass}>
                    Category
                  </label>
                  <SelectWrap>
                    <select
                      id="category"
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option value="">Select</option>
                      {subcategoryByType.gig.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                  </SelectWrap>
                  {fieldError('category')}
                </div>
                <div className="space-y-2">
                  <label htmlFor="delivery" className={labelClass}>
                    Delivery Time
                  </label>
                  <SelectWrap>
                    <select
                      id="delivery"
                      value={form.deliveryTime}
                      onChange={(e) => set('deliveryTime', e.target.value)}
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      <option value="">Select</option>
                      {['1 Day', '2 Days', '3 Days', '5 Days', '7 Days', '14 Days'].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </SelectWrap>
                  {fieldError('deliveryTime')}
                </div>
              </div>
            )}

            {/* Service: fixed vs per hour segmented control */}
            {type === 'service' && (
              <div className="space-y-2">
                <span className={labelClass}>Pricing Model</span>
                <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-violet-800">
                  {[
                    { v: 'fixed', label: 'Fixed' },
                    { v: 'hourly', label: 'Per Hour' },
                  ].map((m) => (
                    <button
                      key={m.v}
                      type="button"
                      onClick={() => set('priceModel', m.v)}
                      aria-pressed={form.priceModel === m.v}
                      className={`flex-1 rounded-lg py-2 text-xs font-bold transition ${
                        form.priceModel === m.v
                          ? 'bg-white text-gray-900 shadow-sm dark:bg-violet-600 dark:text-white'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price (label per type) */}
            <div className="space-y-2">
              <label htmlFor="price" className={labelClass}>
                {type === 'task' ? 'Budget (₦)' : type === 'job' ? 'Salary Budget (₦)' : 'Price (₦)'}
              </label>
              <input
                id="price"
                type="number"
                inputMode="numeric"
                min="0"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder={type === 'task' ? '2500' : type === 'job' ? '150000' : type === 'service' ? '10000' : '5000'}
                className={`${inputClass} font-bold`}
              />
              {fieldError('price')}
            </div>

            {/* Task: urgent deadline notice box */}
            {type === 'task' && (
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
            )}

            {/* Job: type + salary period side by side */}
            {type === 'job' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="jobType" className={labelClass}>
                    Job Type
                  </label>
                  <SelectWrap>
                    <select
                      id="jobType"
                      value={form.jobType}
                      onChange={(e) => set('jobType', e.target.value)}
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      {['Full-time', 'Part-time', 'Contract', 'Internship'].map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                    </select>
                  </SelectWrap>
                </div>
                <div className="space-y-2">
                  <label htmlFor="salaryPeriod" className={labelClass}>
                    Salary Period
                  </label>
                  <SelectWrap>
                    <select
                      id="salaryPeriod"
                      value={form.salaryPeriod}
                      onChange={(e) => set('salaryPeriod', e.target.value)}
                      className={`${inputClass} appearance-none pr-9`}
                    >
                      {['Per Hour', 'Per Week', 'Per Month'].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </SelectWrap>
                </div>
              </div>
            )}

            {/* Service + task: location */}
            {(type === 'service' || type === 'task') && (
              <div className="space-y-2">
                <label htmlFor="location" className={labelClass}>
                  {type === 'task' ? 'Pickup Location' : 'Location'}
                </label>
                <input
                  id="location"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder={type === 'task' ? 'Enter address' : 'Lagos, Nigeria'}
                  className={inputClass}
                />
                {fieldError('location')}
                {type === 'service' && (
                  <label className="mt-2 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isRemote}
                      onChange={(e) => {
                        set('isRemote', e.target.checked);
                        if (e.target.checked && errors.location) setErrors((er) => ({ ...er, location: '' }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Can be done remotely</span>
                  </label>
                )}
              </div>
            )}

            {/* Job: requirements */}
            {type === 'job' && (
              <div className="space-y-2">
                <label htmlFor="requirements" className={labelClass}>
                  Requirements
                </label>
                <textarea
                  id="requirements"
                  rows={3}
                  value={form.requirements}
                  onChange={(e) => set('requirements', e.target.value)}
                  placeholder="List key responsibilities..."
                  className={`${inputClass} resize-none p-4`}
                />
              </div>
            )}

            {/* Gig: cover image upload */}
            {type === 'gig' && (
              <div className="space-y-2">
                <span className={labelClass}>Gig Cover Image</span>
                <button
                  type="button"
                  onClick={() => coverInput.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-500 transition hover:bg-gray-50 dark:border-violet-600 dark:bg-violet-800 dark:text-gray-300 dark:hover:bg-violet-700/40"
                >
                  {cover ? (
                    <>
                      <img src={cover} alt="Cover preview" className="mb-2 h-20 w-full rounded-lg object-cover" />
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Cover added. Tap to change
                      </span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="mb-2 h-6 w-6" />
                      <span className="text-xs font-medium">Upload cover (16:9 ratio)</span>
                    </>
                  )}
                </button>
                <input ref={coverInput} type="file" accept="image/*" onChange={pickCover} className="hidden" />
              </div>
            )}

            {/* Digital: product file + thumbnail */}
            {type === 'digital' && (
              <>
                <div className="space-y-2">
                  <span className={labelClass}>Upload Product File</span>
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-white p-6 text-gray-500 transition hover:bg-gray-50 dark:border-violet-600 dark:bg-violet-800 dark:text-gray-300 dark:hover:bg-violet-700/40"
                  >
                    {file ? (
                      <span className="flex items-center gap-1.5 text-xs font-medium">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> {file.name} ({file.type})
                      </span>
                    ) : (
                      <>
                        <FileUp className="mb-2 h-6 w-6" />
                        <span className="text-xs font-medium">Upload ZIP, PDF, or Audio (Max 50MB)</span>
                      </>
                    )}
                  </button>
                  {fieldError('file')}
                  <input ref={fileInput} type="file" onChange={pickFile} className="hidden" />
                </div>
                <div className="space-y-2">
                  <span className={labelClass}>Cover Image</span>
                  <button
                    type="button"
                    onClick={() => coverInput.current?.click()}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white p-4 text-gray-500 transition hover:bg-gray-50 dark:border-violet-600 dark:bg-violet-800 dark:text-gray-300 dark:hover:bg-violet-700/40"
                  >
                    {cover ? (
                      <>
                        <img src={cover} alt="Cover preview" className="h-10 w-10 rounded-lg object-cover" />
                        <span className="text-xs font-medium">Thumbnail added. Tap to change</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs font-medium">Add a thumbnail image</span>
                      </>
                    )}
                  </button>
                  <input ref={coverInput} type="file" accept="image/*" onChange={pickCover} className="hidden" />
                </div>
              </>
            )}
          </form>

          {/* Footer publish button (mock footer) */}
          <div className="border-t border-gray-100 bg-white p-4 pb-6 dark:border-violet-700 dark:bg-violet-900">
            <button
              type="submit"
              form="mock-post-form"
              disabled={submitting}
              className={`w-full rounded-xl py-3.5 font-bold text-white shadow-lg transition-all disabled:opacity-60 ${t.btn}`}
            >
              {submitting ? 'Publishing...' : t.cta}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
