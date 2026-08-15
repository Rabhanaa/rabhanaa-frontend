import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';

export type PostType = 'sell' | 'buy';

// Post moderation actions, modelled on useUserVerdict. The post type is a query
// parameter because sell auctions and buy requests live in separate tables.
export function usePostVerdict() {
  const [isPending, setIsPending] = useState(false);
  const { handleError } = useApiError();

  async function act(
    path: string,
    type: PostType,
    successMessage: string,
    body: unknown,
    onSuccess?: () => void,
  ): Promise<void> {
    setIsPending(true);
    try {
      await api.post(`${path}?type=${type}`, body);
      toast.success(successMessage);
      onSuccess?.();
    } catch (err) {
      handleError(err);
    } finally {
      setIsPending(false);
    }
  }

  return {
    isPending,
    approve: (id: string, type: PostType, onSuccess?: () => void) =>
      act(`/admin/posts/${id}/approve`, type, 'تم نشر المنشور', {}, onSuccess),
    reject: (id: string, type: PostType, reason: string, onSuccess?: () => void) =>
      act(`/admin/posts/${id}/reject`, type, 'تم رفض المنشور', { reason }, onSuccess),
    suspend: (id: string, type: PostType, reason: string, onSuccess?: () => void) =>
      act(`/admin/posts/${id}/suspend`, type, 'تم إيقاف المنشور', { reason }, onSuccess),
    unsuspend: (id: string, type: PostType, onSuccess?: () => void) =>
      act(`/admin/posts/${id}/unsuspend`, type, 'تم إعادة نشر المنشور', {}, onSuccess),
  };
}
