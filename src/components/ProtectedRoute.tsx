import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, isCarrier } from '@/stores/auth';
import { useConfigStore, type AppConfig } from '@/stores/config';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const location = useLocation();
  const config = useConfigStore((state) => state.config);
  const setConfig = useConfigStore((state) => state.setConfig);

  useEffect(() => {
    if (!token || config) return;
    api.get<AppConfig>('/config').then(setConfig).catch(() => {});
  }, [token, config, setConfig]);

  // Show loading while auth is initializing (prevents redirect on page refresh)
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Only redirect if initialized and no token
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // A carrier has no business on a merchant screen: it cannot post, bid, hold
  // orders or subscribe, and every one of those pages would either 403 or show
  // it prices it has no need for. Deep links, stale tabs and notifications all
  // land here, so the guard belongs at the route rather than on each caller.
  if (isCarrier(user) && !location.pathname.startsWith('/carrier')) {
    return <Navigate to="/carrier/jobs" replace />;
  }

  return <>{children}</>;
}
