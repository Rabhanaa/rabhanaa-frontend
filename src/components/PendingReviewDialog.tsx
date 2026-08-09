import { Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PendingReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingReviewDialog({ open, onOpenChange }: PendingReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm" dir="rtl">
        <DialogHeader className="items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center">
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900">
            حسابك قيد المراجعة
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            حسابك قيد المراجعة من قِبَل الفريق. يمكنك تصفح الصفقات فقط في الوقت الحالي، وستتمكن من النشر والمزايدة بمجرد اعتماد حسابك
          </DialogDescription>
        </DialogHeader>
        <button
          onClick={() => onOpenChange(false)}
          className="w-full h-12 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl font-bold transition-colors mt-2"
        >
          حسناً
        </button>
      </DialogContent>
    </Dialog>
  );
}
