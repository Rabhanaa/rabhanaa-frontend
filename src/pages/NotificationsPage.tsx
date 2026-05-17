import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Gavel, Package, CheckCircle2, Clock, AlertTriangle, UserCheck, UserX } from 'lucide-react';
import { useNotificationStore } from '@/stores/notifications';
import type { Notification } from '@/stores/notifications';
import { resolveNotificationLink } from '@/lib/notificationLink';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Skeleton } from '@/components/ui/skeleton';

const eventTypeIcons: Record<string, React.ElementType> = {
  new_bid: Gavel,
  auction_ended: Gavel,
  bid_selected: CheckCircle2,
  order_created: Package,
  order_confirmed: CheckCircle2,
  selection_expiring: Clock,
  account_approved: UserCheck,
  account_rejected: UserX,
  auction_ended_no_bids: AlertTriangle,
  winner_selected: CheckCircle2,
  bid_not_selected: AlertTriangle,
  new_offer: Gavel,
  offer_accepted: CheckCircle2,
  offer_not_accepted: AlertTriangle,
  new_sell_auction: Gavel,
  new_buy_request: Gavel,
  request_ended: Gavel,
  request_ended_no_offers: AlertTriangle,
  selection_expired: Clock,
  order_completed: CheckCircle2,
  order_expired: AlertTriangle,
};

const eventTypeColors: Record<string, string> = {
  new_bid: 'bg-blue-50 text-blue-600 border-blue-200',
  auction_ended: 'bg-green-50 text-green-600 border-green-200',
  bid_selected: 'bg-green-50 text-green-600 border-green-200',
  order_created: 'bg-purple-50 text-purple-600 border-purple-200',
  order_confirmed: 'bg-green-50 text-green-600 border-green-200',
  selection_expiring: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  account_approved: 'bg-green-50 text-green-600 border-green-200',
  account_rejected: 'bg-red-50 text-red-600 border-red-200',
  auction_ended_no_bids: 'bg-gray-50 text-gray-600 border-gray-200',
  winner_selected: 'bg-green-50 text-green-600 border-green-200',
  bid_not_selected: 'bg-gray-50 text-gray-600 border-gray-200',
  new_offer: 'bg-blue-50 text-blue-600 border-blue-200',
  offer_accepted: 'bg-green-50 text-green-600 border-green-200',
  offer_not_accepted: 'bg-gray-50 text-gray-600 border-gray-200',
  new_sell_auction: 'bg-blue-50 text-blue-600 border-blue-200',
  new_buy_request: 'bg-blue-50 text-blue-600 border-blue-200',
  request_ended: 'bg-green-50 text-green-600 border-green-200',
  request_ended_no_offers: 'bg-gray-50 text-gray-600 border-gray-200',
  selection_expired: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  order_completed: 'bg-green-50 text-green-600 border-green-200',
  order_expired: 'bg-red-50 text-red-600 border-red-200',
};

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  if (diffDays < 7) return `منذ ${diffDays} يوم`;
  return date.toLocaleDateString('ar-SA');
}


export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    const link = resolveNotificationLink(notification.data);
    if (link) {
      navigate(link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6" dir="rtl">
      <ScreenHeader title="الإشعارات" onBack={() => navigate(-1)} />

      {unreadCount > 0 && (
        <button
          onClick={handleMarkAllAsRead}
          className="mb-4 text-sm font-bold text-green-600 hover:text-green-700 transition-colors"
        >
          تحديد الكل كمقروء
        </button>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-bold">لا توجد إشعارات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = eventTypeIcons[notification.data?.type ?? ''] || Bell;
            const colorClass = eventTypeColors[notification.data?.type ?? ''] || 'bg-gray-50 text-gray-600 border-gray-200';

            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-2xl p-4 shadow-sm border cursor-pointer hover:shadow-md transition-shadow ${
                  notification.is_read ? 'border-gray-100' : 'border-green-200 bg-green-50'
                }`}
              >
                <div className="flex gap-3">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center border ${colorClass}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{notification.title}</p>
                    <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{notification.body}</p>
                    <p className="text-gray-400 text-xs mt-1">{getRelativeTime(notification.created_at)}</p>
                  </div>
                  {!notification.is_read && (
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 mt-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}