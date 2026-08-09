import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWhatsAppUrl } from '@/lib/support';
import { trackPixel } from '@/lib/pixel';

// Anchored bottom-left: the layout is RTL and BottomNav puts a floating "+"
// button dead centre, so the left corner is the only reliably free one.
// bottom-20 clears the 64px nav bar; screens without it pass their own offset.
export function WhatsAppFab({ className }: { className?: string }) {
  const whatsappUrl = useWhatsAppUrl();

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا على واتساب"
      onClick={() => trackPixel('Lead', { source: 'whatsapp_fab' })}
      className={cn(
        'fixed bottom-20 left-4 z-40 grid size-14 place-items-center rounded-full',
        'bg-[#25D366] text-white shadow-lg shadow-black/25',
        'transition-transform hover:scale-105 active:scale-95',
        className,
      )}
    >
      <MessageCircle className="size-7" aria-hidden="true" />
    </a>
  );
}
