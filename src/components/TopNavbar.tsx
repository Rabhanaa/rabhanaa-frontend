import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Headset } from 'lucide-react';
import { useNotificationStore } from '@/stores/notifications';

export function TopNavbar() {
  const navigate = useNavigate();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/70 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Brand/Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/auctions')}>
          <img src="/brand/icon-white-square.png" alt="" className="size-9 rounded-xl shadow-lg" />
          <div>
            <div className="text-lg font-extrabold leading-none text-gray-900">ربحانة</div>
            <div className="text-[10px] text-gray-400 font-bold">دايما ربحانة</div>
          </div>
        </div>

        {/* Notification & Profile Buttons */}
        <div className="flex items-center gap-2">
          {/* Support Button */}
          <button
            onClick={() => navigate('/support')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all active:scale-95 shadow-sm"
            aria-label="الدعم الفني"
          >
            <Headset size={20} />
          </button>

          {/* Notification Button */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all active:scale-95 shadow-sm"
            aria-label="الإشعارات"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Button */}
          <button
            onClick={() => navigate('/profile')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 border border-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-100 transition-all active:scale-95 shadow-sm"
            aria-label="الحساب الشخصي"
          >
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
