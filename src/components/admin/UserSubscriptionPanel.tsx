import { useEffect, useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { SubscriptionTierSelect } from './SubscriptionTierSelect';
import { DateRangePicker } from './DateRangePicker';
import { DatePicker } from './DatePicker';
import { ConfirmDialog } from './ConfirmDialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface Subscription {
  id: string;
  tier_name: string;
  display_name_ar: string;
  started_at: string;
  expires_at: string | null;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
}

interface SubscriptionsResponse {
  subscriptions: Subscription[];
}

function formatArabicDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function UserSubscriptionPanel({ userPublicId }: { userPublicId: string }) {
  const { handleError } = useApiError();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Grant dialog state
  const [grantOpen, setGrantOpen] = useState(false);
  const [grantTier, setGrantTier] = useState('');
  const [grantStart, setGrantStart] = useState<Date | null>(new Date());
  const [grantEnd, setGrantEnd] = useState<Date | null>(addDays(new Date(), 30));
  const [grantPending, setGrantPending] = useState(false);

  // Extend dialog state
  const [extendOpen, setExtendOpen] = useState(false);
  const [extendDate, setExtendDate] = useState<Date | null>(null);
  const [extendPending, setExtendPending] = useState(false);

  // Cancel confirm state
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPending, setCancelPending] = useState(false);

  // Which subscription the extend/cancel dialogs target
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);

  async function fetchSubscriptions() {
    try {
      const res = await api.get<SubscriptionsResponse>(
        `/admin/users/${userPublicId}/subscriptions`
      );
      setSubscriptions(res.subscriptions ?? []);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubscriptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPublicId]);

  // ---- Grant ----
  function openGrant() {
    setGrantTier('');
    setGrantStart(new Date());
    setGrantEnd(addDays(new Date(), 30));
    setGrantOpen(true);
  }

  async function submitGrant() {
    if (!grantTier) return;
    setGrantPending(true);
    try {
      await api.post(`/admin/users/${userPublicId}/subscription`, {
        tier_name: grantTier,
        started_at: grantStart?.toISOString() ?? new Date().toISOString(),
        expires_at: grantEnd?.toISOString() ?? null,
      });
      setGrantOpen(false);
      toast.success('تم إضافة الاشتراك');
      await fetchSubscriptions();
    } catch (err) {
      handleError(err);
    } finally {
      setGrantPending(false);
    }
  }

  // ---- Extend ----
  function openExtend(sub: Subscription) {
    setSelectedSub(sub);
    const base = sub.expires_at ? new Date(sub.expires_at) : new Date();
    setExtendDate(addDays(base, 30));
    setExtendOpen(true);
  }

  async function submitExtend() {
    if (!selectedSub || !extendDate) return;
    setExtendPending(true);
    try {
      await api.patch(`/admin/users/${userPublicId}/subscription/${selectedSub.id}`, {
        expires_at: extendDate.toISOString(),
      });
      setExtendOpen(false);
      toast.success('تم تمديد الاشتراك');
      await fetchSubscriptions();
    } catch (err) {
      handleError(err);
      await fetchSubscriptions();
    } finally {
      setExtendPending(false);
    }
  }

  // ---- Cancel ----
  function openCancel(sub: Subscription) {
    setSelectedSub(sub);
    setCancelOpen(true);
  }

  async function submitCancel() {
    if (!selectedSub) return;
    setCancelPending(true);
    try {
      await api.patch(`/admin/users/${userPublicId}/subscription/${selectedSub.id}`, {
        is_active: false,
      });
      setCancelOpen(false);
      toast.success('تم إلغاء الاشتراك');
      await fetchSubscriptions();
    } catch (err) {
      handleError(err);
    } finally {
      setCancelPending(false);
    }
  }

  const activeSubscriptions = subscriptions.filter((s) => s.is_active);
  const inactiveSubscriptions = subscriptions.filter((s) => !s.is_active);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">الاشتراكات</h3>
        <Button size="sm" onClick={openGrant}>
          إضافة اشتراك
        </Button>
      </div>

      {/* Empty state */}
      {subscriptions.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          <p>لا يوجد اشتراكات</p>
          <Button size="sm" onClick={openGrant}>
            إضافة اشتراك
          </Button>
        </div>
      )}

      {/* Active subscriptions */}
      {activeSubscriptions.map((sub) => (
        <Card key={sub.id}>
          <CardHeader className="flex flex-row items-start justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{sub.display_name_ar}</CardTitle>
              {sub.is_primary && <Badge variant="default">أساسي</Badge>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">خيارات</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openExtend(sub)}>تمديد</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openCancel(sub)}
                  className="text-destructive focus:text-destructive"
                >
                  إلغاء
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>تاريخ البدء: {formatArabicDate(sub.started_at)}</p>
            <p>
              تاريخ الانتهاء:{' '}
              {sub.expires_at ? formatArabicDate(sub.expires_at) : 'بدون انتهاء'}
            </p>
          </CardContent>
        </Card>
      ))}

      {/* Inactive subscriptions — history toggle */}
      {inactiveSubscriptions.length > 0 && (
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory((prev) => !prev)}
            className="text-muted-foreground"
          >
            {showHistory ? 'إخفاء السجل' : 'السجل'}
          </Button>
          {showHistory &&
            inactiveSubscriptions.map((sub) => (
              <Card key={sub.id} className="opacity-60">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{sub.display_name_ar}</CardTitle>
                    {sub.is_primary && <Badge variant="secondary">أساسي</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>تاريخ البدء: {formatArabicDate(sub.started_at)}</p>
                  <p>
                    تاريخ الانتهاء:{' '}
                    {sub.expires_at ? formatArabicDate(sub.expires_at) : 'بدون انتهاء'}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Grant dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة اشتراك</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <SubscriptionTierSelect value={grantTier} onChange={setGrantTier} />
            <DateRangePicker
              startDate={grantStart}
              endDate={grantEnd}
              onStartChange={setGrantStart}
              onEndChange={setGrantEnd}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)}>
              تراجع
            </Button>
            <Button onClick={submitGrant} disabled={!grantTier || grantPending}>
              {grantPending ? 'جارٍ الإضافة...' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend dialog */}
      <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تمديد الاشتراك</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <DatePicker
              value={extendDate}
              onChange={setExtendDate}
              placeholder="تاريخ الانتهاء الجديد"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendOpen(false)}>
              تراجع
            </Button>
            <Button onClick={submitExtend} disabled={!extendDate || extendPending}>
              {extendPending ? 'جارٍ التمديد...' : 'تمديد'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirm dialog */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="إلغاء الاشتراك"
        description="هل أنت متأكد من إلغاء الاشتراك؟"
        confirmLabel={cancelPending ? 'جارٍ الإلغاء...' : 'إلغاء الاشتراك'}
        cancelLabel="تراجع"
        onConfirm={submitCancel}
        destructive
      />
    </div>
  );
}
