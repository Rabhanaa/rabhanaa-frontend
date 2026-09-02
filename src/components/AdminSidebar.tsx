import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Search, ClipboardCheck, LayoutDashboard, LogOut, Headset, FileCheck, Settings, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

interface PendingResponse {
  users: unknown[];
}

export function AdminSidebar() {
  const name = useAuthStore((s) => s.user?.name);
  const [hasPending, setHasPending] = useState(false);
  const [hasPendingPosts, setHasPendingPosts] = useState(false);

  useEffect(() => {
    api
      .get<PendingResponse>('/admin/users/pending?page_size=1')
      .then((res) => {
        setHasPending(res.users.length > 0);
      })
      .catch(() => {
        // Silently ignore — sidebar badge is non-critical
      });

    api
      .get<{ total: number }>('/admin/posts/pending?page_size=1')
      .then((res) => setHasPendingPosts(res.total > 0))
      .catch(() => {
        // Silently ignore — sidebar badge is non-critical
      });
  }, []);

  const baseClass =
    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground';
  const activeClass = 'bg-accent text-accent-foreground';

  return (
    <div className="flex flex-col h-full">
      {/* Logo / app name */}
      <div className="px-4 py-5 border-b flex items-center gap-2">
        <img src="/brand/icon-green.png" alt="" className="h-7 w-auto" />
        <span className="text-lg font-bold">ربحانة</span>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {/* 1. Search */}
        <NavLink
          to="/admin/users"
          className={({ isActive }) => cn(baseClass, isActive && activeClass)}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span>البحث عن المستخدمين</span>
        </NavLink>

        {/* 2. Pending */}
        <NavLink
          to="/admin/users/pending"
          className={({ isActive }) => cn(baseClass, isActive && activeClass)}
        >
          <ClipboardCheck className="h-4 w-4 shrink-0" />
          <span className="flex-1">قيد المراجعة</span>
          {hasPending && (
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0" />
          )}
        </NavLink>

        {/* 3. Post moderation */}
        <NavLink
          to="/admin/posts"
          className={({ isActive }) => cn(baseClass, isActive && activeClass)}
        >
          <FileCheck className="h-4 w-4 shrink-0" />
          <span className="flex-1">مراجعة المنشورات</span>
          {hasPendingPosts && (
            <span className="inline-block h-2 w-2 rounded-full bg-red-500 shrink-0" />
          )}
        </NavLink>

        {/* 4. Commission collection */}
        <NavLink
          to="/admin/commissions"
          className={({ isActive }) => cn(baseClass, isActive && activeClass)}
        >
          <Wallet className="h-4 w-4 shrink-0" />
          <span>العمولات</span>
        </NavLink>

        {/* 5. Platform settings */}
        <NavLink
          to="/admin/settings"
          className={({ isActive }) => cn(baseClass, isActive && activeClass)}
        >
          <Settings className="h-4 w-4 shrink-0" />
          <span>الإعدادات</span>
        </NavLink>

        {/* 6. Issues */}
        <NavLink
          to="/admin/issues"
          className={({ isActive }) => cn(baseClass, isActive && activeClass)}
        >
          <Headset className="h-4 w-4 shrink-0" />
          <span>الدعم الفني</span>
        </NavLink>

        {/* 4. Dashboard */}
        <NavLink
          to="/admin"
          end
          className={({ isActive }) => cn(baseClass, isActive && activeClass)}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          <span>الرئيسية</span>
        </NavLink>
      </nav>

      {/* Footer: admin info + logout */}
      <div className="border-t px-4 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate flex-1">{name}</span>
          <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 shrink-0">
            مسؤول
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => useAuthStore.getState().logout()}
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}
