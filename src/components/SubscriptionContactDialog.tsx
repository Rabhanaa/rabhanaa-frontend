import { Lock, MessageCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWhatsAppUrl } from '@/lib/support';

interface SubscriptionContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubscriptionContactDialog({ open, onOpenChange }: SubscriptionContactDialogProps) {
  const whatsappUrl = useWhatsAppUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm" dir="rtl">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
            <Lock className="h-8 w-8 text-green-600" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900">
            اشترك الآن للوصول إلى جميع المميزات
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            للنشر والمزايدة على المنصة، تواصل معنا عبر واتساب لتفعيل اشتراكك
          </DialogDescription>
        </DialogHeader>
        <button
          onClick={() => window.open(whatsappUrl, '_blank')}
          className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors mt-2"
        >
          <MessageCircle className="h-5 w-5" />
          تواصل معنا للاشتراك
        </button>
      </DialogContent>
    </Dialog>
  );
}
