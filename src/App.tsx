import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { api } from './lib/api';
import { ensurePushToken } from './lib/notifications';
import type { User } from './stores/auth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SelectInterestsPage } from './pages/SelectInterestsPage';
import { SetLocationPage } from './pages/SetLocationPage';
import { UploadDocumentsPage } from './pages/UploadDocumentsPage';
import { AuctionsPage } from './pages/AuctionsPage';
import { SellAuctionDetailPage } from './pages/SellAuctionDetailPage';
import { BuyRequestDetailPage } from './pages/BuyRequestDetailPage';
import { CreateAuctionPage } from './pages/CreateAuctionPage';
import { MyAuctionsPage } from './pages/MyAuctionsPage';
import { MyBidsPage } from './pages/MyBidsPage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SupportPage } from './pages/SupportPage';
import Index from './pages/Index';
import { Toaster } from './components/ui/sonner';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { UsersSearchPage } from './pages/admin/UsersSearchPage';
import { PendingVerificationPage } from './pages/admin/PendingVerificationPage';
import { UserDetailPage } from './pages/admin/UserDetailPage';
import { AdminNotFoundPage } from './pages/admin/AdminNotFoundPage';
import { AdminIssuesPage } from './pages/admin/AdminIssuesPage';
import { PostModerationPage } from './pages/admin/PostModerationPage';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { AdminLayout } from './components/AdminLayout';
import { NotificationListener } from './components/NotificationListener';
import { PixelTracker } from './components/PixelTracker';

function App() {
  useEffect(() => {
    const store = useAuthStore.getState();
    store.initialize();

    // Refresh user from server after loading cached state, so subscription
    // status is always up to date without requiring a re-login.
    if (localStorage.getItem('token')) {
      api.get<User>('/auth/me').then((fresh) => store.setUser(fresh)).catch(() => {});

      // Re-send the FCM token on every load. It used to be sent only from the
      // login screen, but the JWT lasts a year — so once a token rotated or
      // expired nothing ever replaced it and push went quiet permanently.
      ensurePushToken().catch((err) => console.error('[push] token sync failed:', err));
    }
  }, [])

  // Re-sync subscription status whenever the tab becomes visible again.
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== 'visible') return;
      const store = useAuthStore.getState();
      if (!store.token) return;
      api.get<User>('/auth/me').then((fresh) => store.setUser(fresh)).catch(() => {});
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [])

  return (
    <>
      <Toaster position="top-center" richColors />
      <PWAUpdatePrompt />
      <BrowserRouter>
        <NotificationListener />
        <PixelTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/select-interests" element={<ProtectedRoute><SelectInterestsPage /></ProtectedRoute>} />
          <Route path="/set-location" element={<ProtectedRoute><SetLocationPage /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><UploadDocumentsPage /></ProtectedRoute>} />
          <Route path="/auctions" element={<ProtectedRoute><MainLayout><AuctionsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/auctions/sell/:publicId" element={<ProtectedRoute><MainLayout><SellAuctionDetailPage /></MainLayout></ProtectedRoute>} />
          <Route path="/auctions/buy/:publicId" element={<ProtectedRoute><MainLayout><BuyRequestDetailPage /></MainLayout></ProtectedRoute>} />
          <Route path="/create" element={<ProtectedRoute><MainLayout><CreateAuctionPage /></MainLayout></ProtectedRoute>} />
          <Route path="/my-auctions" element={<ProtectedRoute><MainLayout><MyAuctionsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/my-bids" element={<ProtectedRoute><MainLayout><MyBidsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><MainLayout><OrdersPage /></MainLayout></ProtectedRoute>} />
          <Route path="/orders/:publicId" element={<ProtectedRoute><MainLayout><OrderDetailPage /></MainLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><MainLayout><ProfilePage /></MainLayout></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><MainLayout><NotificationsPage /></MainLayout></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute><MainLayout><SupportPage /></MainLayout></ProtectedRoute>} />
          <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
          <Route path="/change-password" element={<ProtectedRoute><ChangePasswordPage /></ProtectedRoute>} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/*" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="users" element={<UsersSearchPage />} />
            <Route path="users/pending" element={<PendingVerificationPage />} />
            <Route path="users/:publicId" element={<UserDetailPage />} />
            <Route path="issues" element={<AdminIssuesPage />} />
            <Route path="posts" element={<PostModerationPage />} />
            <Route path="*" element={<AdminNotFoundPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
