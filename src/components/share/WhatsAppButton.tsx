import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

// WhatsApp deep-link share (borrowed from Postall) — WhatsApp is the
// dominant sharing channel in Nigeria, so listing pages get a dedicated button.
export function WhatsAppButton({ title, price }: { title: string; price?: string }) {
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
      className="flex items-center gap-2 py-2.5 -my-2.5 px-2 -mx-2 text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors"
    >
      <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
      <span className="text-sm">WhatsApp</span>
    </button>
  );
}
