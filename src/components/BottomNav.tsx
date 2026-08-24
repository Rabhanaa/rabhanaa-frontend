import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, List, Coins, Package, Truck, User } from 'lucide-react';
import { useAuthStore, isCarrier } from '@/stores/auth';
import { RegisterPromptDialog } from './RegisterPromptDialog';

const tabs = [
  { path: '/auctions', label: 'الصفقات', icon: Home },
  { path: '/my-auctions', label: 'صفقاتي', icon: List },
  { path: '/create', label: '', icon: Plus }, // center floating
  { path: '/my-bids', label: 'عروضي', icon: Coins },
  { path: '/orders', label: 'الطلبات', icon: Package },
];

// A carrier (#14) shares none of the merchant tabs: it cannot post, bid or hold
// orders. Three tabs, no floating create button.
const carrierTabs = [
  { path: '/carrier/jobs', label: 'الشحنات', icon: Truck },
  { path: '/carrier/quotes', label: 'عروضي', icon: Coins },
  { path: '/carrier/profile', label: 'حسابي', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [promptOpen, setPromptOpen] = useState(false);
  const carrier = isCarrier(user);

  // A visitor keeps the feed tab; the rest would only redirect them, so the
  // centre button becomes the way in instead.
  const visibleTabs = carrier
    ? carrierTabs
    : token
      ? tabs
      : tabs.filter((t) => t.path === '/auctions' || t.path === '/create');

  const isMainRoute = [
    '/auctions', '/create', '/my-auctions', '/my-bids', '/orders', '/profile', '/carrier',
  ].some((path) => location.pathname.startsWith(path) || location.pathname === path);

  if (!isMainRoute) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-5px_15px_rgba(0,0,0,0.03)] z-50 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {visibleTabs.map((tab) => {
          const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
          const Icon = tab.icon;

          // 3.3 — Floating center Create button
          if (tab.path === '/create') {
            return (
              <div key={tab.path} className="relative -top-5">
                <button
                  onClick={() => (token ? navigate(tab.path) : setPromptOpen(true))}
                  className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-green-600/40 active:scale-95 transition-transform border-4 border-gray-50"
                >
                  <Plus size={28} />
                </button>
              </div>
            );
          }

          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                isActive ? 'text-green-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {/* 3.2 — Active: larger icon + bold label */}
              <Icon size={isActive ? 26 : 22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold`}>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <RegisterPromptDialog
        open={promptOpen}
        onOpenChange={setPromptOpen}
        action="نشر صفقة"
      />
    </div>
  );
}
