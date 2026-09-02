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
      // The backend sends data-only messages and carries the text in _title /
      // _body, so payload.notification is always undefined — reading it first
      // produced a toast with no title and no body at all. sw.ts already reads
      // them in this order; this is the foreground half of the same rule.
      const title = payload.data?._title ?? payload.notification?.title ?? '';
      const description = payload.data?._body ?? payload.notification?.body;
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
