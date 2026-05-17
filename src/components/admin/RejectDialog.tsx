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

const CANNED_REASONS = [
  { value: 'المستندات غير مكتملة', label: 'المستندات غير مكتملة' },
  { value: 'المستندات غير واضحة', label: 'المستندات غير واضحة' },
  { value: 'المعلومات غير صحيحة', label: 'المعلومات غير صحيحة' },
  { value: 'النشاط التجاري غير مؤهل', label: 'النشاط التجاري غير مؤهل' },
  { value: 'مخالفة شروط الاستخدام', label: 'مخالفة شروط الاستخدام' },
  { value: 'other', label: 'أخرى' },
];

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending?: boolean;
}

export function RejectDialog({ open, onOpenChange, onConfirm, isPending }: RejectDialogProps) {
  const [selected, setSelected] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  const isOther = selected === 'other';
  const isConfirmEnabled =
    selected !== '' &&
    (!isOther || customReason.length >= 10);

  function handleConfirm() {
    if (!isConfirmEnabled) return;
    const reason = isOther ? customReason : selected;
    onConfirm(reason);
    setSelected('');
    setCustomReason('');
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelected('');
      setCustomReason('');
    }
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>رفض الحساب</AlertDialogTitle>
          <AlertDialogDescription>
            اختر سبب الرفض
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue placeholder="اختر سبباً" />
            </SelectTrigger>
            <SelectContent>
              {CANNED_REASONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
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
            disabled={!isConfirmEnabled || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            تأكيد الرفض
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
