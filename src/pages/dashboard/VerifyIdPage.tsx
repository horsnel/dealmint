import { useRef, useState } from 'react';
import { BadgeCheck, FileUp, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { compressImage } from '@/lib/image';
import { usePageTitle } from '@/hooks/usePageTitle';

const docTypes = [
  { value: 'National ID (NIN)', desc: 'National Identity Number slip or card' },
  { value: "Voter's card", desc: 'INEC Permanent Voter\u2019s Card' },
  { value: 'International passport', desc: 'Nigerian passport photo page' },
  { value: "Driver's licence", desc: 'FRSC driver\u2019s licence' },
  { value: 'CAC certificate', desc: 'For registered business accounts' },
];

const benefits = [
  'The blue ID Checked badge on your profile and listings',
  'Higher trust from buyers — verified sellers get more orders',
  'Required before requesting payouts above \u20A6500,000',
];

export function VerifyIdPage() {
  usePageTitle('Verify your ID');
  const { user, submitIdVerification } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState(user?.idDocType || '');
  const [file, setFile] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!user) return null;

  const idVerified = user.idStatus === 'verified' || user.idVerified;
  const idPending = user.idStatus === 'pending';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      setFile(await compressImage(f, 600, 0.6));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read that file');
    }
  };

  const handleSubmit = () => {
    if (idVerified) return;
    if (idPending) {
      toast.info('Your ID is already under review');
      return;
    }
    if (!docType) return void toast.error('Choose the type of ID');
    if (!file) return void toast.error('Upload a clear photo of your ID');
    setSubmitting(true);
    submitIdVerification(docType);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('ID submitted for review — this usually takes a moment');
    }, 400);
  };

  return (
    <div className="min-h-screen bg-lavender dark:bg-violet-950 pt-20 lg:pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-display font-bold text-2xl lg:text-3xl text-gray-900 dark:text-white mb-2 flex items-center gap-3">
          <BadgeCheck className="w-7 h-7 text-violet-600 dark:text-amber-400" />
          Verify your ID
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Confirm your identity with a Nigerian government-issued document. Your details stay
          private — other users only ever see the badge.
        </p>

        {/* Status */}
        <div
          className={`card-white dark:bg-violet-800 dark:border-violet-700 p-6 mb-8 ${
            idVerified ? 'border-l-4 border-l-green-500' : ''
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                  idVerified
                    ? 'bg-green-100 dark:bg-green-900/40'
                    : idPending
                      ? 'bg-amber-100 dark:bg-amber-900/40'
                      : 'bg-gray-100 dark:bg-violet-700'
                }`}
              >
                <ShieldCheck
                  className={`w-6 h-6 ${
                    idVerified
                      ? 'text-green-600 dark:text-green-400'
                      : idPending
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-300'
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white">
                  {idVerified ? 'ID verified' : idPending ? 'Under review' : 'Not verified yet'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {idVerified
                    ? `Verified with ${user.idDocType || 'your ID'}. The badge is live on your profile.`
                    : idPending
                      ? 'We are reviewing your document. You will get a notification shortly.'
                      : 'Takes about a minute. Have a clear photo of your document ready.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {!idVerified && (
          <>
            {/* Benefits */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">What you get</h2>
              <ul className="space-y-2">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <ShieldCheck className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                    <span className="min-w-0">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Document type */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Choose your document</h2>
              <div className="space-y-2.5">
                {docTypes.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDocType(t.value)}
                    aria-pressed={docType === t.value}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                      docType === t.value
                        ? 'border-violet-600 bg-violet-50 dark:bg-violet-700 shadow-sm'
                        : 'border-gray-200 dark:border-violet-600 hover:border-violet-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.value}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload */}
            <div className="card-white dark:bg-violet-800 dark:border-violet-700 p-6 mb-8">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Upload the document</h2>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              {file ? (
                <div className="relative">
                  <img
                    src={file}
                    alt="ID document preview"
                    className="w-full max-h-56 object-contain rounded-lg border dark:border-violet-600 bg-gray-50 dark:bg-violet-900"
                  />
                  <button
                    type="button"
                    onClick={() => setFile('')}
                    aria-label="Remove photo"
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-violet-900/90 text-gray-600 dark:text-gray-200 flex items-center justify-center shadow"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-violet-600 flex flex-col items-center justify-center text-gray-500 dark:text-gray-300 hover:border-violet-500 transition-colors"
                >
                  <FileUp className="w-8 h-8 mb-2 text-violet-600 dark:text-amber-400" />
                  <span className="text-sm font-medium">Tap to upload a photo</span>
                  <span className="text-xs mt-1">JPG or PNG, clear and uncropped</span>
                </button>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={submitting || idPending}
              className="w-full h-12 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-semibold"
            >
              {idPending ? 'Already under review' : submitting ? 'Submitting...' : 'Submit for verification'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
