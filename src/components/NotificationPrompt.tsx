import { useEffect, useState } from 'react';
import { Bell, Share, X } from 'lucide-react';
import { toast } from 'sonner';
import { pushSupported, registerPushToken } from '@/lib/notifications';
import { needsIOSInstallForPush } from '@/lib/platform';
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

  // On iOS there is nothing to ask for until the app is installed: Safari
  // exposes the Notification API only to a Home Screen app. Without this the
  // card is simply absent and the user is left to guess why no notification
  // ever arrives.
  const [needsInstall, setNeedsInstall] = useState(false);

  useEffect(() => {
    // Registering a device token needs an account, so offering this to a
    // visitor would burn their permission prompt on a request that 401s.
    if (!token) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    if (needsIOSInstallForPush()) {
      setNeedsInstall(true);
      setVisible(true);
      return;
    }

    if (!pushSupported()) return;
    if (Notification.permission !== 'default') return; // granted or denied — nothing to ask
    setVisible(true);
  }, [token]);

  const enable = async () => {
    setBusy(true);
    try {
      await registerPushToken();
      if (Notification.permission === 'granted') {
        toast.success('تم تفعيل الإشعارات');
      }
    } catch (err) {
      // The user gets one sentence; whoever is debugging needs the real cause.
      // Swallowing it entirely meant a failure here was indistinguishable from
      // a denied permission, with nothing in the console either way.
      console.error('[push] enable failed:', err);
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

  // iOS cannot be prompted from a browser tab, so there is no button to offer —
  // only the two steps that make notifications possible at all.
  if (needsInstall) {
    return (
      <div className="mx-4 mt-3 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3" dir="rtl">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100">
          <Share className="size-5 text-blue-600" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-gray-900">لتصلك الإشعارات على الآيفون</p>
          <p className="mt-0.5 text-xs text-gray-600">
            أضف ربحانة إلى الشاشة الرئيسية: اضغط زر المشاركة في سفاري ثم «إضافة إلى الشاشة
            الرئيسية»، وافتح التطبيق من الأيقونة.
          </p>
        </div>
        <button onClick={dismiss} aria-label="إغلاق" className="shrink-0 text-gray-400 hover:text-gray-600">
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

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
