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

const DURATION_OPTIONS = [
  { label: '24 ساعة', value: '24' },
  { label: '3 أيام', value: '72' },
  { label: '7 أيام', value: '168' },
  { label: '30 يوم', value: '720' },
  { label: 'بدون موعد محدد', value: 'indefinite' },
];

interface SuspendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, durationHours?: number) => void;
  isPending?: boolean;
}

export function SuspendDialog({ open, onOpenChange, onConfirm, isPending }: SuspendDialogProps) {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState('');

  const isConfirmEnabled = reason.trim().length >= 3 && duration !== '';

  function handleConfirm() {
    if (!isConfirmEnabled) return;
    const durationHours = duration === 'indefinite' ? undefined : parseInt(duration, 10);
    onConfirm(reason.trim(), durationHours);
    setReason('');
    setDuration('');
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setReason('');
      setDuration('');
    }
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>تعليق الحساب</AlertDialogTitle>
          <AlertDialogDescription>
            حدد مدة التعليق وأدخل سبباً واضحاً
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue placeholder="اختر مدة التعليق" />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Textarea
            placeholder="سبب التعليق (3 أحرف على الأقل)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isPending}
            className="bg-amber-500 text-white hover:bg-amber-600"
          >
            تأكيد التعليق
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
