import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

// WhatsApp deep-link share (borrowed from Postall) — WhatsApp is the
// dominant sharing channel in Nigeria, so listing pages get a dedicated button.
// Renders as an outlined pill so it can sit in a grid next to Save / Share.
export function WhatsAppButton({ title, price, className = '' }: { title: string; price?: string; className?: string }) {
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = price
    ? `Check out "${title}" for ${price} on Dealmint! ${shareUrl}`
    : `Check out "${title}" on Dealmint! ${shareUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleClick = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast.success('Opening WhatsApp...');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Share ${title} on WhatsApp`}
      className={`flex items-center justify-center gap-1.5 h-10 rounded-full border border-gray-200 dark:border-violet-600 text-sm text-gray-600 dark:text-gray-300 hover:text-green-700 hover:border-green-300 hover:bg-green-50 dark:hover:text-green-300 dark:hover:border-green-700 dark:hover:bg-green-900/20 transition-colors ${className}`}
    >
      <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
      <span>WhatsApp</span>
    </button>
  );
}
