import { useRegisterSW } from 'virtual:pwa-register/react';
import { toast } from 'sonner';
import { useEffect } from 'react';

export function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_, registration) {
      if (registration) {
        // Poll for updates every 60 seconds
        const id = setInterval(() => registration.update(), 60_000);
        window.addEventListener('beforeunload', () => clearInterval(id), { once: true });
      }
    },
    onRegisterError(error) {
      // InvalidStateError means a stale SW (script 'Unknown') is blocking registration.
      // Clear every registration and reload once — subsequent load registers cleanly.
      if (error?.name === 'InvalidStateError') {
        const RECOVERY_KEY = 'sw-recovery-v1'
        if (!sessionStorage.getItem(RECOVERY_KEY)) {
          sessionStorage.setItem(RECOVERY_KEY, '1')
          navigator.serviceWorker.getRegistrations()
            .then((regs) => Promise.all(regs.map((r) => r.unregister())))
            .then(() => window.location.reload())
        }
      }
    },
  });

  useEffect(() => {
    if (needRefresh) {
      toast('يوجد تحديث جديد', {
        description: 'تم إصدار نسخة جديدة من التطبيق.',
        action: {
          label: 'تحديث الآن',
          onClick: () => updateServiceWorker(true),
        },
        duration: Infinity,
        dismissible: true,
      });
    }
  }, [needRefresh, updateServiceWorker]);

  return null;
}
