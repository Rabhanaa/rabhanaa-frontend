import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import { pushSupported, registerPushToken } from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth';

const DISMISSED_KEY = 'notif-prompt-dismissed';

// In-app priming card. The browser permission dialog is only opened when the
// user taps "تفعيل" — never automatically. A denied permission cannot be
// re-requested by the page, so asking without context would permanently lock
// that user out of push.
export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Registering a device token needs an account, so offering this to a
    // visitor would burn their permission prompt on a request that 401s.
    if (!token) return;
    if (!pushSupported()) return;
    if (Notification.permission !== 'default') return; // granted or denied — nothing to ask
    if (localStorage.getItem(DISMISSED_KEY)) return;
    setVisible(true);
  }, [token]);

  const enable = async () => {
    setBusy(true);
    try {
      await registerPushToken();
      if (Notification.permission === 'granted') {
        toast.success('تم تفعيل الإشعارات');
      }
    } catch {
      toast.error('تعذر تفعيل الإشعارات');
    } finally {
      setBusy(false);
      setVisible(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-green-100 bg-green-50 p-3" dir="rtl">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-green-100">
        <Bell className="size-5 text-green-600" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900">فعّل الإشعارات</p>
        <p className="text-xs text-gray-500">لتصلك الصفقات الجديدة في تخصصاتك أول بأول</p>
      </div>
      <button
        onClick={enable}
        disabled={busy}
        className="shrink-0 rounded-xl bg-green-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-60"
      >
        {busy ? '...' : 'تفعيل'}
      </button>
      <button onClick={dismiss} aria-label="إغلاق" className="shrink-0 text-gray-400 hover:text-gray-600">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
