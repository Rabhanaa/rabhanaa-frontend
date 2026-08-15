import { useNavigate } from 'react-router-dom';
import { LogIn, MessageCircle, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWhatsAppUrl } from '@/lib/support';
import { trackPixel } from '@/lib/pixel';

interface RegisterPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** What the visitor was trying to do, e.g. "لتقديم عرض على هذه الصفقة". */
  action?: string;
}

// Shown when a visitor taps something that needs an account. Registration is
// the primary path — the request is explicit that nobody acts without an
// account — with WhatsApp underneath for anyone who wants to talk first.
export function RegisterPromptDialog({ open, onOpenChange, action }: RegisterPromptDialogProps) {
  const navigate = useNavigate();
  const whatsappUrl = useWhatsAppUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-3xl" dir="rtl">
        <DialogHeader className="items-center space-y-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
            <UserPlus className="size-8 text-green-600" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900">
            سجل للمتابعة
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {action ? `${action} تحتاج حساباً على ربحانة.` : 'تحتاج حساباً على ربحانة للمتابعة.'}
            {' '}التسجيل مجاني ويستغرق دقيقة.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-2">
          <button
            onClick={() => {
              trackPixel('Lead', { source: 'register_prompt' });
              navigate('/register');
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-600 font-bold text-white transition-colors hover:bg-green-700"
          >
            <UserPlus className="size-5" />
            سجل الآن
          </button>

          <button
            onClick={() => navigate('/login')}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <LogIn className="size-4" />
            لدي حساب بالفعل
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackPixel('Lead', { source: 'register_prompt_whatsapp' })}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold text-gray-500 transition-colors hover:text-gray-700"
          >
            <MessageCircle className="size-4" />
            أو تواصل معنا على واتساب
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
