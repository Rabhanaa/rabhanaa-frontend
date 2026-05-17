import { create } from "zustand";
import { api } from "@/lib/api";

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  body: string;
  event_type: string;
  data: Record<string, string>;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
}

interface NotificationsStore {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationsStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const response = await api.get<NotificationsResponse>("/notifications?limit=50");
      const notifications = response.notifications || [];
      const unreadCount = notifications.filter((n) => !n.is_read).length;
      set({ notifications, unreadCount, loading: false });
    } catch {
      set({ notifications: [], unreadCount: 0, loading: false });
    }
  },

  markAsRead: async (id: number) => {
    try {
      await api.post(`/notifications/${id}/read`, {});
      const notifications = get().notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = Math.max(0, get().unreadCount - 1);
      set({ notifications, unreadCount });
    } catch {
      void 0;
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post("/notifications/read-all", {});
      const notifications = get().notifications.map((n) => ({
        ...n,
        is_read: true,
      }));
      set({ notifications, unreadCount: 0 });
    } catch {
      void 0;
    }
  },
}));