import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AdminSidebar } from '@/components/AdminSidebar';
import { AdminHeader } from '@/components/AdminHeader';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';

export function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar — fixed width on the start (right in RTL) */}
      <aside className="hidden lg:flex flex-col w-64 border-e shrink-0">
        <AdminSidebar />
      </aside>

      {/* Mobile drawer — slides from start edge (right in RTL) */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-64 p-0">
          <AdminSidebar />
        </SheetContent>
      </Sheet>

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        <AdminHeader onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-6">
          <AdminErrorBoundary>
            <Outlet />
          </AdminErrorBoundary>
        </main>
      </div>
    </div>
  );
}
