import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';

export function useUserVerdict() {
  const [isPending, setIsPending] = useState(false);
  const { handleError } = useApiError();

  async function approve(publicId: string, onSuccess?: () => void): Promise<void> {
    setIsPending(true);
    try {
      await api.post(`/admin/users/${publicId}/approve`, {});
      toast.success('تم تفعيل الحساب');
      onSuccess?.();
    } catch (err) {
      handleError(err);
    } finally {
      setIsPending(false);
    }
  }

  async function reject(publicId: string, reason: string, onSuccess?: () => void): Promise<void> {
    setIsPending(true);
    try {
      await api.post(`/admin/users/${publicId}/reject`, { reason });
      toast.success('تم رفض الحساب');
      onSuccess?.();
    } catch (err) {
      handleError(err);
    } finally {
      setIsPending(false);
    }
  }

  return { approve, reject, isPending };
}
