import { toast } from 'sonner';
import { WhatsAppIcon } from '@/components/share/BrandIcons';

// WhatsApp deep-link (borrowed from Postall) — WhatsApp is the dominant
// sharing channel in Nigeria. Rendered as the brand's green circular glyph
// (official simple-icons mark) instead of a labelled pill; the full target
// picker lives in SharePopup, opened from the Share button.
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
      className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:bg-[#1fbe5a] active:scale-95 transition-all shrink-0"
    >
      <WhatsAppIcon className="w-5 h-5" />
    </button>
  );
}
