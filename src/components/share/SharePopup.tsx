import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Mail, MessageCircle, Link2, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { WhatsAppIcon, FacebookIcon, TelegramIcon } from '@/components/share/BrandIcons';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  price?: string;
}

/**
 * Bottom share sheet, modelled on the mobile OS share target picker: drag
 * handle, "Share link" header, a 3-column grid of branded app targets and a
 * quiet bottom bar with Copy link / Share via... (native share sheet).
 *
 * Target behaviour mirrors Nigerian usage: WhatsApp first-class, then email,
 * SMS, Facebook Feed and Telegram. Everything deep-links out; nothing here
 * proxies through the backend.
 */
export function SharePopup({ open, onClose, title, price }: Props) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = price
    ? `Check out "${title}" for ${price} on Dealmint! ${url}`
    : `Check out "${title}" on Dealmint! ${url}`;

  // Escape closes; background scroll locked while the sheet is up
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  const openTarget = (href: string, message: string) => {
    window.open(href, '_blank', 'noopener,noreferrer');
    toast.success(message);
    onClose();
  };

  const targets: Array<{
    key: string;
    label: string;
    sub?: string;
    tile: string;
    href: string;
    message: string;
    icon: React.ReactNode;
  }> = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      tile: 'rounded-full bg-[#25D366] text-white',
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
      message: 'Opening WhatsApp...',
      icon: <WhatsAppIcon className="w-7 h-7" />,
    },
    {
      key: 'email',
      label: 'Email',
      tile: 'bg-transparent text-[#EA4335]',
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText)}`,
      message: 'Opening your mail app...',
      icon: <Mail className="w-8 h-8" strokeWidth={2.2} />,
    },
    {
      key: 'messages',
      label: 'Messages',
      tile: 'rounded-full bg-[#007AFF] text-white',
      href: `sms:?&body=${encodeURIComponent(shareText)}`,
      message: 'Opening Messages...',
      icon: <MessageCircle className="w-7 h-7 fill-current" strokeWidth={0} />,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      sub: 'Feed',
      tile: 'rounded-2xl bg-[#1877F2] text-white',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      message: 'Opening Facebook...',
      icon: <FacebookIcon className="h-7 w-auto" />,
    },
    {
      key: 'telegram',
      label: 'Telegram',
      tile: 'rounded-full bg-[#2AABEE] text-white',
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      message: 'Opening Telegram...',
      icon: <TelegramIcon className="w-7 h-7" />,
    },
  ];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      onClose();
    } catch {
      toast.error('Could not copy the link. Copy it from the address bar instead.');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user dismissed the native sheet — nothing to do
      }
      onClose();
      return;
    }
    // No native sheet (most desktops): copy as the closest equivalent
    handleCopy();
  };

  return createPortal(
    <div className="fixed inset-0 z-[60] fade-in" role="dialog" aria-modal="true" aria-label={`Share ${title}`}>
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center pointer-events-none">
        <div className="sheet-up pointer-events-auto w-full max-w-[500px] bg-white dark:bg-violet-900 rounded-t-3xl px-5 pt-3.5 pb-9 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
          {/* Drag handle (visual only) */}
          <div className="w-10 h-1 bg-gray-200 dark:bg-violet-700 rounded-full mx-auto mb-4" aria-hidden="true" />

          <p className="text-center text-base font-semibold text-gray-900 dark:text-white mb-7">Share link</p>

          {/* App targets grid */}
          <div className="grid grid-cols-3 gap-y-6 gap-x-4 mb-7">
            {targets.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => openTarget(t.href, t.message)}
                className="flex flex-col items-center gap-2.5 group"
              >
                <span
                  className={`w-[60px] h-[60px] flex items-center justify-center rounded-2xl transition-transform group-active:scale-95 ${t.tile}`}
                >
                  {t.icon}
                </span>
                <span className="text-[13px] leading-tight text-gray-700 dark:text-gray-200 text-center">
                  {t.label}
                  {t.sub && (
                    <span className="block text-[10px] text-gray-400 dark:text-gray-500">{t.sub}</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Bottom action bar */}
          <div className="flex justify-around border-t border-gray-100 dark:border-violet-800 pt-5">
            <button type="button" onClick={handleCopy} className="flex flex-col items-center gap-2">
              <span className="w-[50px] h-[50px] rounded-full bg-gray-100 dark:bg-violet-800 flex items-center justify-center text-gray-800 dark:text-gray-100">
                <Link2 className="w-5 h-5" />
              </span>
              <span className="text-[13px] text-gray-700 dark:text-gray-200">Copy link</span>
            </button>
            <button type="button" onClick={handleNativeShare} className="flex flex-col items-center gap-2">
              <span className="w-[50px] h-[50px] rounded-full bg-gray-100 dark:bg-violet-800 flex items-center justify-center text-gray-800 dark:text-gray-100">
                <Share2 className="w-5 h-5" />
              </span>
              <span className="text-[13px] text-gray-700 dark:text-gray-200">Share via...</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
