import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, MapPin, FileUp, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ListingCard } from '@/components/common/ListingCard';
import { useApp } from '@/context/AppContext';
import { compressImage } from '@/lib/image';
import { formatBytes } from '@/lib/format';
import { subcategoryByType } from '@/lib/categories';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { Listing, ListingType } from '@/types';

interface Props {
  type: ListingType;
  listing?: Listing;
}

const defaultImage: Record<ListingType, string> = {
  gig: '/images/category_gigs.jpg',
  task: '/images/category_tasks.jpg',
  job: '/images/category_jobs.jpg',
  service: '/images/category_services.jpg',
  digital: '/images/category_digital.jpg',
};

const copy: Record<
  ListingType,
  { title: string; section: string; titleLabel: string; titlePlaceholder: string; priceLabel: string; descPlaceholder: string; submit: string }
> = {
  gig: {
    title: 'Post a Gig',
    section: 'Gig Details',
    titleLabel: 'Gig title',
    titlePlaceholder: 'e.g., I will design a professional logo for your business',
    priceLabel: 'Price (₦)',
    descPlaceholder: 'Describe what you offer, what buyers get and how you work...',
    submit: 'Post Gig',
  },
  task: {
    title: 'Post a Task',
    section: 'Task Details',
    titleLabel: 'What do you need done?',
    titlePlaceholder: 'e.g., Help me move furniture to my new apartment',
    priceLabel: 'Budget (₦)',
    descPlaceholder: 'Describe your task in detail...',
    submit: 'Post Task',
  },
  job: {
    title: 'Post a Job',
    section: 'Job Details',
    titleLabel: 'Job title',
    titlePlaceholder: 'e.g., Remote customer support agent',
    priceLabel: 'Pay (₦)',
    descPlaceholder: 'Describe the role, responsibilities and working hours...',
    submit: 'Post Job',
  },
  service: {
    title: 'Offer a Service',
    section: 'Service Details',
    titleLabel: 'Service title',
    titlePlaceholder: 'e.g., JAMB English lessons',
    priceLabel: 'Price (₦)',
    descPlaceholder: 'Describe the service, your experience and how sessions work...',
    submit: 'Post Service',
  },
  digital: {
    title: 'Sell a Digital Product',
    section: 'Product Details',
    titleLabel: 'Product title',
    titlePlaceholder: 'e.g., Notion budget template',
    priceLabel: 'Price (₦)',
    descPlaceholder: 'Describe what is included, formats and who it is for...',
    submit: 'Publish Product',
  },
};

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;

export function ListingForm({ type, listing }: Props) {
  const c = copy[type];
  const editing = !!listing;
  usePageTitle(editing ? 'Edit listing' : c.title);
  const navigate = useNavigate();
  const { user, addListing, updateListing } = useApp();
  const imageInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<string[]>(listing && listing.images[0] !== defaultImage[type] ? listing.images : []);
  const [file, setFile] = useState<{ name: string; size: number; type: string } | null>(
    listing?.fileName ? { name: listing.fileName, size: listing.fileSize || 0, type: listing.fileType || '' } : null
  );
  const [form, setForm] = useState({
    title: listing?.title || '',
    category: listing?.category || '',
    price: listing ? String(listing.price) : '',
    priceType: listing?.priceType || (type === 'job' ? 'hourly' : 'fixed'),
    description: listing?.description || '',
    deliveryTime: listing?.deliveryTime || '',
    location: listing?.location && listing.location !== 'Remote' ? listing.location : '',
    isRemote: listing ? listing.isRemote : type === 'gig' || type === 'digital' || type === 'job',
    deadline: listing?.deadline || '',
    requirements: listing?.requirements || '',
    tags: listing ? listing.tags.join(', ') : '',
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }));
  };

  const showLocation = type === 'task' || type === 'service' || type === 'job' || type === 'gig';
  const locationRequired = type === 'task';
  const needsImages = type === 'gig' || type === 'service' || type === 'digital';

  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} images`);
      return;
    }
    const added: string[] = [];
    for (const f of files.slice(0, room)) {
      if (f.size > MAX_IMAGE_BYTES) {
        toast.error(`${f.name} is larger than 8 MB`);
        continue;
      }
      try {
        added.push(await compressImage(f));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Could not add that image');
      }
    }
    if (files.length > room) toast.info(`Only ${MAX_IMAGES} images are allowed, extra files were skipped`);
    if (added.length) {
      setImages((prev) => [...prev, ...added]);
      toast.success(added.length === 1 ? 'Image added' : `${added.length} images added`);
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const validate = (asDraft: boolean) => {
    const e: Record<string, string> = {};
    if (form.title.trim().length < 10) e.title = 'Give it a clear title of at least 10 characters';
    if (form.title.trim().length > 90) e.title = 'Keep the title under 90 characters';
    if (!asDraft) {
      if (!form.category) e.category = 'Choose a category';
      const price = Number(form.price);
      const min = type === 'task' ? 500 : 100;
      if (!form.price || !Number.isFinite(price) || price < min) e.price = `Enter an amount of at least ₦${min}`;
      if (price > 100000000) e.price = 'That amount looks too high';
      if (form.description.trim().length < 30) e.description = 'Add at least 30 characters so people know what to expect';
      if (locationRequired && !form.location.trim()) e.location = 'Add a location';
      if (type === 'task') {
        if (!form.deadline) e.deadline = 'Choose a deadline';
        else if (form.deadline < new Date().toISOString().slice(0, 10)) e.deadline = 'The deadline cannot be in the past';
      }
      if (type === 'gig' && !form.deliveryTime) e.deliveryTime = 'Choose a delivery time';
      if (needsImages && images.length === 0 && !listing) e.images = 'Add at least one image';
      if (type === 'digital' && !file) e.file = 'Upload the file buyers will receive';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildData = (asDraft: boolean) => {
    const tags = form.tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 8);
    const loc = form.location.trim();
    return {
      title: form.title.trim(),
      description: form.description.trim(),
      type,
      category: form.category || 'Other',
      price: Math.round(Number(form.price) || 0),
      priceType: form.priceType as Listing['priceType'],
      location: loc || undefined,
      isRemote: form.isRemote || !loc,
      images: images.length ? images : [defaultImage[type]],
      tags,
      deliveryTime: type === 'gig' ? form.deliveryTime : type === 'digital' ? 'Instant download' : undefined,
      requirements: form.requirements.trim() || undefined,
      deadline: type === 'task' ? form.deadline : undefined,
      fileName: type === 'digital' ? file?.name : undefined,
      fileSize: type === 'digital' ? file?.size : undefined,
      fileType: type === 'digital' ? file?.type : undefined,
      isDraft: asDraft,
      isActive: asDraft ? false : true,
    };
  };

  const submit = (asDraft: boolean) => {
    if (!user) return;
    if (!user.phoneVerified) {
      toast.info('Verify your phone number before posting');
      navigate('/verify-phone', { state: { from: window.location.pathname } });
      return;
    }
    if (!validate(asDraft)) {
      toast.error('Please fix the highlighted fields');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      const data = buildData(asDraft);
      if (editing && listing) {
        // Editing keeps a paused listing paused, but publishing a draft makes it live
        updateListing(listing.id, {
          ...data,
          isDraft: asDraft,
          isActive: asDraft ? false : listing.isDraft ? true : listing.isActive,
        });
        toast.success(asDraft ? 'Draft saved' : 'Listing updated');
      } else {
        const created = addListing(data);
        if (!created) {
          toast.error('Something went wrong. Please try again.');
          setIsSubmitting(false);
          return;
        }
        toast.success(asDraft ? 'Draft saved' : `${c.submit.replace('Post ', '').replace('Publish ', '')} posted successfully!`);
      }
      setIsSubmitting(false);
      navigate('/dashboard/listings');
    }, 600);
  };

  const previewListing = (): Listing | null => {
    if (!user) return null;
    const data = buildData(false);
    return {
      ...data,
      id: 'preview',
      seller: user,
      rating: 0,
      reviewCount: 0,
      completedOrders: 0,
      createdAt: new Date().toISOString(),
      isFeatured: false,
      isActive: true,
      isDraft: false,
    };
  };

  const fieldError = (k: string) =>
    errors[k] ? (
      <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-1">
        {errors[k]}
      </p>
    ) : null;

  const inputClass = 'mt-1 dark:bg-violet-700 dark:border-violet-600';
  const preview = previewOpen ? previewListing() : null;

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-6">
          {editing ? `Edit ${c.title.replace('Post a ', '').replace('Offer a ', '').replace('Sell a ', '')}` : c.title}
        </h1>

        {user && !user.phoneVerified && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-200">
            Verify your phone number to publish.{' '}
            <Link to="/verify-phone" state={{ from: window.location.pathname }} className="font-semibold underline">
              Verify now
            </Link>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
          noValidate
        >
          <Card className="dark:bg-violet-800 dark:border-violet-700">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">{c.section}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title" className="dark:text-gray-200">
                  {c.titleLabel} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder={c.titlePlaceholder}
                  maxLength={90}
                  className={inputClass}
                />
                {fieldError('title')}
              </div>

              {/* Category */}
              <div>
                <Label className="dark:text-gray-200">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={form.category} onValueChange={(v) => set('category', v)}>
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategoryByType[type].map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {fieldError('category')}
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" className="dark:text-gray-200">
                    {c.priceLabel} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="5000"
                    className={inputClass}
                  />
                  {fieldError('price')}
                </div>
                {type === 'task' ? (
                  <div>
                    <Label htmlFor="deadline" className="dark:text-gray-200">
                      Deadline <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="deadline"
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      value={form.deadline}
                      onChange={(e) => set('deadline', e.target.value)}
                      className={inputClass}
                    />
                    {fieldError('deadline')}
                  </div>
                ) : type === 'digital' ? (
                  <div />
                ) : (
                  <div>
                    <Label className="dark:text-gray-200">Price type</Label>
                    <Select value={form.priceType} onValueChange={(v) => set('priceType', v as Listing['priceType'])}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">{type === 'job' ? 'Fixed (per month)' : 'Fixed price'}</SelectItem>
                        <SelectItem value="hourly">Per hour</SelectItem>
                        <SelectItem value="negotiable">Negotiable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Delivery time (gigs) */}
              {type === 'gig' && (
                <div>
                  <Label className="dark:text-gray-200">
                    Delivery time <span className="text-red-500">*</span>
                  </Label>
                  <Select value={form.deliveryTime} onValueChange={(v) => set('deliveryTime', v)}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="How long will it take?" />
                    </SelectTrigger>
                    <SelectContent>
                      {['1 day', '2 days', '3 days', '5 days', '7 days', '14 days'].map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldError('deliveryTime')}
                </div>
              )}

              {/* Location */}
              {showLocation && (
                <div>
                  <Label htmlFor="location" className="dark:text-gray-200">
                    Location {locationRequired && <span className="text-red-500">*</span>}
                  </Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      placeholder="e.g., Ikeja, Lagos"
                      className="pl-10 dark:bg-violet-700 dark:border-violet-600"
                    />
                  </div>
                  {fieldError('location')}
                  {!locationRequired && (
                    <div className="flex items-center gap-2 mt-3">
                      <Checkbox
                        id="remote"
                        checked={form.isRemote}
                        onCheckedChange={(v) => set('isRemote', v === true)}
                      />
                      <label htmlFor="remote" className="text-sm text-gray-600 dark:text-gray-300">
                        Can be done remotely
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              <div>
                <Label htmlFor="description" className="dark:text-gray-200">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder={c.descPlaceholder}
                  rows={6}
                  maxLength={2000}
                  className={inputClass}
                />
                <div className="flex justify-between">
                  {fieldError('description') || <span />}
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{form.description.length}/2000</span>
                </div>
              </div>

              {/* Requirements */}
              {(type === 'job' || type === 'service' || type === 'gig') && (
                <div>
                  <Label htmlFor="requirements" className="dark:text-gray-200">
                    {type === 'job' ? 'Requirements' : 'What you need from the buyer'} (optional)
                  </Label>
                  <Textarea
                    id="requirements"
                    value={form.requirements}
                    onChange={(e) => set('requirements', e.target.value)}
                    rows={3}
                    maxLength={1000}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Tags */}
              <div>
                <Label htmlFor="tags" className="dark:text-gray-200">
                  Tags (optional)
                </Label>
                <Input
                  id="tags"
                  value={form.tags}
                  onChange={(e) => set('tags', e.target.value)}
                  placeholder="logo, branding, design"
                  className={inputClass}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Separate with commas. Up to 8 tags.</p>
              </div>

              {/* Digital file */}
              {type === 'digital' && (
                <div>
                  <Label className="dark:text-gray-200">
                    Product file <span className="text-red-500">*</span>
                  </Label>
                  <input ref={fileInput} type="file" className="hidden" onChange={handleFile} />
                  {file ? (
                    <div className="mt-1 flex items-center gap-3 p-3 rounded-xl border dark:border-violet-600">
                      <FileUp className="w-5 h-5 text-violet-600 dark:text-amber-400" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatBytes(file.size)} · {file.type}
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => fileInput.current?.click()} className="dark:border-violet-600 dark:text-white">
                        Replace
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="mt-1 w-full border-2 border-dashed border-gray-300 dark:border-violet-600 rounded-xl p-8 text-center hover:border-violet-500 transition-colors"
                    >
                      <FileUp className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 dark:text-gray-300">Click to choose a file</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">PDF, ZIP, audio, templates and more. Up to 50 MB.</p>
                    </button>
                  )}
                  {fieldError('file')}
                </div>
              )}

              {/* Images */}
              <div>
                <Label className="dark:text-gray-200">
                  {type === 'digital' ? 'Cover image' : 'Images'}{' '}
                  {needsImages ? <span className="text-red-500">*</span> : <span className="text-gray-400">(optional)</span>}
                </Label>
                <input
                  ref={imageInput}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImages}
                />
                <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border dark:border-violet-600">
                      <img src={img} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        aria-label={`Remove image ${i + 1}`}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <button
                      type="button"
                      onClick={() => imageInput.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-violet-600 flex flex-col items-center justify-center text-gray-500 dark:text-gray-300 hover:border-violet-500 transition-colors"
                    >
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs">Add image</span>
                    </button>
                  )}
                </div>
                {fieldError('images')}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Up to {MAX_IMAGES} images, 8 MB each.</p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 dark:border-violet-600 dark:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => submit(true)}
                  className="flex-1 dark:border-violet-600 dark:text-white"
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (validate(false)) setPreviewOpen(true);
                    else toast.error('Fix the highlighted fields to preview');
                  }}
                  className="flex-1 dark:border-violet-600 dark:text-white"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-violet-600 hover:bg-violet-700"
                >
                  {isSubmitting ? 'Saving...' : editing ? 'Save changes' : c.submit}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="dark:bg-violet-900 dark:border-violet-700 max-w-sm">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Preview</DialogTitle>
            <DialogDescription className="dark:text-gray-300">This is how your listing appears in search.</DialogDescription>
          </DialogHeader>
          {preview && <ListingCard listing={preview} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
