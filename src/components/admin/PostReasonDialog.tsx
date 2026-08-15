import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Same shape as RejectDialog, but for posts rather than accounts — the canned
// reasons are about the listing itself, and it serves both reject and suspend.
const CANNED_REASONS = [
  'الصورة غير واضحة أو غير مناسبة',
  'السعر غير منطقي',
  'الوصف غير مكتمل',
  'المنتج غير مسموح به على المنصة',
  'بيانات مكررة أو مضللة',
  'مخالفة شروط الاستخدام',
];

const OTHER = 'other';

interface PostReasonDialogProps {
  open: boolean;
  mode: 'reject' | 'suspend';
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

export function PostReasonDialog({
  open,
  mode,
  onOpenChange,
  onConfirm,
  isPending,
}: PostReasonDialogProps) {
  const [selected, setSelected] = useState('');
  const [customReason, setCustomReason] = useState('');

  const isOther = selected === OTHER;
  const canConfirm = selected !== '' && (!isOther || customReason.trim().length >= 10);

  function reset() {
    setSelected('');
    setCustomReason('');
  }

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm(isOther ? customReason.trim() : selected);
    reset();
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  const isReject = mode === 'reject';

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{isReject ? 'رفض المنشور' : 'إيقاف المنشور'}</AlertDialogTitle>
          <AlertDialogDescription>
            {isReject
              ? 'اختر سبب الرفض — سيصل السبب لصاحب المنشور.'
              : 'اختر سبب الإيقاف — سيصل السبب لصاحب المنشور وسيختفي المنشور من الصفقات.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="اختر سبباً" />
            </SelectTrigger>
            <SelectContent>
              {CANNED_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
              <SelectItem value={OTHER}>أخرى</SelectItem>
            </SelectContent>
          </Select>

          {isOther && (
            <Textarea
              placeholder="اكتب السبب (10 أحرف على الأقل)"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
            />
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isReject ? 'تأكيد الرفض' : 'تأكيد الإيقاف'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
