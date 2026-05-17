import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { UserStatusBadge } from '@/components/admin/UserStatusBadge';
import { UserDocumentsPanel } from '@/components/admin/UserDocumentsPanel';
import { UserSubscriptionPanel } from '@/components/admin/UserSubscriptionPanel';
import { RejectDialog } from '@/components/admin/RejectDialog';
import { SuspendDialog } from '@/components/admin/SuspendDialog';
import { BanDialog } from '@/components/admin/BanDialog';
import { useUserVerdict } from '@/hooks/useUserVerdict';
import { useApiError } from '@/hooks/useApiError';
import { api, ApiError, suspendUser, unsuspendUser, banUser, unbanUser } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserDetail {
  public_id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  is_admin: boolean;
  region_name: string;
  job_name: string;
  rejection_reason?: string;
  interests?: string[];
  subscribed: boolean;
  in_trial: boolean;
  created_at: string;
  suspended_until?: string;
  suspension_reason?: string;
  banned_at?: string;
  banned_reason?: string;
  status_changed_by_admin_id?: string;
  status_changed_at?: string;
}

interface UserDetailResponse {
  user: UserDetail;
}

export function UserDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { handleError } = useApiError();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [banOpen, setBanOpen] = useState(false);
  const [unbanOpen, setUnbanOpen] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const { approve, reject, isPending } = useUserVerdict();

  async function fetchUser() {
    if (!publicId) return;
    try {
      const data = await api.get<UserDetailResponse>(`/admin/users/${publicId}`);
      setUser(data.user);
    } catch (err) {
      if (
        err instanceof ApiError &&
        (err.status === 404 || err.code === 'USER_NOT_FOUND')
      ) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, [publicId]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleApprove() {
    if (!publicId) return;
    approve(publicId, () => fetchUser());
  }

  function handleRejectConfirm(reason: string) {
    if (!publicId) return;
    reject(publicId, reason, () => {
      setRejectOpen(false);
      fetchUser();
    });
  }

  async function handleSuspendConfirm(reason: string, durationHours?: number) {
    if (!publicId) return;
    setIsActing(true);
    try {
      await suspendUser(publicId, reason, durationHours);
      toast.success('تم تعليق الحساب');
      setSuspendOpen(false);
      fetchUser();
    } catch (err) {
      handleError(err);
    } finally {
      setIsActing(false);
    }
  }

  async function handleUnsuspend() {
    if (!publicId) return;
    setIsActing(true);
    try {
      await unsuspendUser(publicId);
      toast.success('تم رفع التعليق عن الحساب');
      fetchUser();
    } catch (err) {
      handleError(err);
    } finally {
      setIsActing(false);
    }
  }

  async function handleBanConfirm(reason: string) {
    if (!publicId) return;
    setIsActing(true);
    try {
      await banUser(publicId, reason);
      toast.success('تم حظر الحساب');
      setBanOpen(false);
      fetchUser();
    } catch (err) {
      handleError(err);
    } finally {
      setIsActing(false);
    }
  }

  async function handleUnban() {
    if (!publicId) return;
    setIsActing(true);
    try {
      await unbanUser(publicId);
      toast.success('تم رفع الحظر عن الحساب');
      setUnbanOpen(false);
      fetchUser();
    } catch (err) {
      handleError(err);
    } finally {
      setIsActing(false);
    }
  }

  // 404 state
  if (notFound) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-8 flex flex-col items-center gap-4">
            <p className="text-lg font-semibold">المستخدم غير موجود</p>
            <Button variant="outline" onClick={() => navigate('/admin/users')}>
              العودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-8 w-60" />
          <Skeleton className="h-px w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-48 w-full rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const createdAtFormatted = new Date(user.created_at).toLocaleDateString('ar-EG');

  const actingDisabled = isPending || isActing;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={user.name}
        breadcrumbs={[
          { label: 'البحث عن المستخدمين', to: '/admin/users' },
          { label: user.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1 order-2 lg:order-none">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">الملف الشخصي</CardTitle>
                <UserStatusBadge status={user.status} suspendedUntil={user.suspended_until} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Suspension banner */}
              {user.status === 'suspended' && (
                <div className="rounded-md bg-amber-50 border border-amber-300 p-3 text-sm text-amber-900">
                  <p className="font-semibold mb-1">
                    موقوف
                    {user.suspended_until
                      ? ` حتى ${new Date(user.suspended_until).toLocaleString('ar-EG')}`
                      : ' — بدون موعد محدد'}
                  </p>
                  {user.suspension_reason && (
                    <p className="text-amber-800">{user.suspension_reason}</p>
                  )}
                </div>
              )}

              {/* Ban banner */}
              {user.status === 'banned' && (
                <div className="rounded-md bg-red-50 border border-red-300 p-3 text-sm text-red-900">
                  <p className="font-semibold mb-1">
                    محظور
                    {user.banned_at
                      ? ` منذ ${new Date(user.banned_at).toLocaleDateString('ar-EG')}`
                      : ''}
                  </p>
                  {user.banned_reason && (
                    <p className="text-red-800">{user.banned_reason}</p>
                  )}
                </div>
              )}

              {/* Field rows */}
              <div className="space-y-3 text-sm">
                <ProfileField label="الاسم" value={user.name} />
                <ProfileField label="البريد الإلكتروني" value={user.email} />
                <ProfileField label="الهاتف" value={user.phone} />
                {user.region_name && (
                  <ProfileField label="المنطقة" value={user.region_name} />
                )}
                {user.job_name && (
                  <ProfileField label="المهنة" value={user.job_name} />
                )}
                <ProfileField label="تاريخ التسجيل" value={createdAtFormatted} />
              </div>

              {/* Rejection reason */}
              {user.status === 'rejected' && user.rejection_reason && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                  <p className="font-medium mb-1">سبب الرفض</p>
                  <p>{user.rejection_reason}</p>
                </div>
              )}

              {/* Interests */}
              {user.interests && user.interests.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">الاهتمامات</p>
                  <div className="flex flex-wrap gap-1">
                    {user.interests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons by status */}
              <ActionButtons
                status={user.status}
                disabled={actingDisabled}
                onApprove={handleApprove}
                onReject={() => setRejectOpen(true)}
                onSuspend={() => setSuspendOpen(true)}
                onUnsuspend={handleUnsuspend}
                onBan={() => setBanOpen(true)}
                onUnban={() => setUnbanOpen(true)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Panels column */}
        <div className="lg:col-span-2 order-1 lg:order-none space-y-6">
          <Card>
            <CardContent className="pt-6">
              <UserDocumentsPanel
                userPublicId={publicId!}
                userStatus={user.status}
                onVerdict={() => fetchUser()}
              />
            </CardContent>
          </Card>

          <UserSubscriptionPanel userPublicId={publicId!} />
        </div>
      </div>

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleRejectConfirm}
        isPending={isPending}
      />

      <SuspendDialog
        open={suspendOpen}
        onOpenChange={setSuspendOpen}
        onConfirm={handleSuspendConfirm}
        isPending={isActing}
      />

      <BanDialog
        open={banOpen}
        onOpenChange={setBanOpen}
        onConfirm={handleBanConfirm}
        userEmail={user.email}
        isPending={isActing}
      />

      {/* Unban confirmation */}
      <AlertDialog open={unbanOpen} onOpenChange={setUnbanOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>رفع الحظر عن الحساب</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من رفع الحظر؟ سيتمكن المستخدم من تسجيل الدخول مرة أخرى.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnban} disabled={isActing}>
              تأكيد رفع الحظر
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ActionButtonsProps {
  status: string;
  disabled: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onUnsuspend: () => void;
  onBan: () => void;
  onUnban: () => void;
}

function ActionButtons({ status, disabled, onApprove, onReject, onSuspend, onUnsuspend, onBan, onUnban }: ActionButtonsProps) {
  switch (status) {
    case 'pending_review':
      return (
        <div className="flex flex-row gap-2 pt-2">
          <Button onClick={onApprove} disabled={disabled} size="sm">
            موافقة
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={onReject}
            disabled={disabled}
          >
            رفض
          </Button>
        </div>
      );
    case 'active':
      return (
        <div className="flex flex-row gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onSuspend} disabled={disabled} className="border-amber-500 text-amber-700 hover:bg-amber-50">
            تعليق
          </Button>
          <Button variant="destructive" size="sm" onClick={onBan} disabled={disabled}>
            حظر
          </Button>
        </div>
      );
    case 'suspended':
      return (
        <div className="flex flex-row gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onUnsuspend} disabled={disabled}>
            رفع التعليق
          </Button>
          <Button variant="destructive" size="sm" onClick={onBan} disabled={disabled}>
            حظر
          </Button>
        </div>
      );
    case 'rejected':
      return (
        <div className="flex flex-row gap-2 pt-2">
          <Button variant="destructive" size="sm" onClick={onBan} disabled={disabled}>
            حظر
          </Button>
        </div>
      );
    case 'banned':
      return (
        <div className="flex flex-row gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onUnban} disabled={disabled}>
            رفع الحظر
          </Button>
        </div>
      );
    default:
      return null;
  }
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted-foreground min-w-[6rem] shrink-0">{label}:</span>
      <span className="font-medium break-all">{value}</span>
    </div>
  );
}
