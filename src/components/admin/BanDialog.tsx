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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface BanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  userEmail: string;
  isPending?: boolean;
}

export function BanDialog({ open, onOpenChange, onConfirm, userEmail, isPending }: BanDialogProps) {
  const [reason, setReason] = useState('');
  const [emailConfirm, setEmailConfirm] = useState('');

  const emailMatches = emailConfirm.trim().toLowerCase() === userEmail.trim().toLowerCase();
  const isConfirmEnabled = reason.trim().length >= 3 && emailMatches;

  function handleConfirm() {
    if (!isConfirmEnabled) return;
    onConfirm(reason.trim());
    setReason('');
    setEmailConfirm('');
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setReason('');
      setEmailConfirm('');
    }
    onOpenChange(nextOpen);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>حظر الحساب</AlertDialogTitle>
          <AlertDialogDescription>
            هذا الإجراء خطير. أدخل البريد الإلكتروني للمستخدم للتأكيد.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-3 py-2">
          <Textarea
            placeholder="سبب الحظر (3 أحرف على الأقل)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              اكتب <span className="font-mono font-medium text-foreground">{userEmail}</span> للتأكيد
            </p>
            <Input
              placeholder="البريد الإلكتروني"
              value={emailConfirm}
              onChange={(e) => setEmailConfirm(e.target.value)}
              dir="ltr"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmEnabled || isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            تأكيد الحظر
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
