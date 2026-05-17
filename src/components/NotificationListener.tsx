import { useEffect } from 'react';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { messaging } from '@/lib/firebase';
import { useNotificationStore } from '@/stores/notifications';
import { resolveNotificationLink } from '@/lib/notificationLink';

export const NotificationListener = () => {
  const navigate = useNavigate();
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useEffect(() => {
    if (!messaging) return;
    const unsubscribe = onMessage(messaging, (payload) => {
      fetchNotifications();
      const title = payload.notification?.title ?? '';
      const description = payload.notification?.body;
      const link = resolveNotificationLink(payload.data ?? null);
      toast(title, {
        description,
        action: link ? { label: 'عرض', onClick: () => navigate(link) } : undefined,
        duration: link ? 8000 : undefined,
      });
    });
    return unsubscribe;
  }, [navigate, fetchNotifications]);

  return null;
};
