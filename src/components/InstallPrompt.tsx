import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

const DISMISSED_KEY = 'install-prompt-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  // iOS Safari predates display-mode and exposes its own flag.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// Nudges installation. This matters beyond convenience: iOS Safari refuses web
// push entirely unless the app has been added to the home screen, so on iOS
// installing is a prerequisite for notifications rather than a nicety.
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  // Derived once at mount rather than set from the effect: iOS never fires
  // beforeinstallprompt, so this depends only on the environment.
  const [showIosHint, setShowIosHint] = useState(
    () => !isStandalone() && !localStorage.getItem(DISMISSED_KEY) && isIos(),
  );

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY) || isIos()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // keep the browser's own mini-infobar from firing
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDeferred(null);
    setShowIosHint(false);
  };

  if (!deferred && !showIosHint) return null;

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3" dir="rtl">
      <div className="grid size-10 shrink-0 place-items-center rounded-full bg-gray-100">
        <Download className="size-5 text-gray-600" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900">ثبّت التطبيق</p>
        {showIosHint ? (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            اضغط <Share className="inline size-3" aria-hidden="true" /> ثم «إضافة إلى الشاشة الرئيسية»
          </p>
        ) : (
          <p className="text-xs text-gray-500">وصول أسرع وإشعارات فورية بالصفقات</p>
        )}
      </div>
      {!showIosHint && (
        <button
          onClick={install}
          className="shrink-0 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-gray-700"
        >
          تثبيت
        </button>
      )}
      <button onClick={dismiss} aria-label="إغلاق" className="shrink-0 text-gray-400 hover:text-gray-600">
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
