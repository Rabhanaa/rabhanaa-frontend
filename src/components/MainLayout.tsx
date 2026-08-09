import { BottomNav } from './BottomNav';
import { TopNavbar } from './TopNavbar';
import { WhatsAppFab } from './WhatsAppFab';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNavbar />
      <div className="flex-1 pb-24 overflow-y-auto">
        {children}
      </div>
      <WhatsAppFab />
      <BottomNav />
    </div>
  );
}
