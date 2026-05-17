import { toast } from 'sonner';
import { ApiError, NetworkError, getArabicMessage } from '@/lib/errors';

export function useApiError() {
  function handleError(err: unknown): void {
    if (err instanceof NetworkError) {
      toast.error('لا يوجد اتصال بالإنترنت');
      return;
    }
    if (err instanceof ApiError) {
      const base = getArabicMessage(err.code);
      const isStatusError = err.code === 'USER_SUSPENDED' || err.code === 'USER_BANNED';
      const reason = isStatusError && err.data && typeof err.data === 'object' && 'reason' in err.data
        ? (err.data as { reason?: string }).reason
        : undefined;
      toast.error(reason ? `${base}\n${reason}` : base);
      return;
    }
    toast.error('حدث خطأ غير متوقع');
  }
  return { handleError };
}
