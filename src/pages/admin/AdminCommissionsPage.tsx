import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertTriangle, Bell, Loader2, Phone } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

const PAGE_SIZE = 20;

interface SellerBalance {
  seller_public_id: string;
  name: string;
  phone: string;
  email: string;
  account_status: string;
  outstanding: string;
  unpaid_invoices: number;
  earliest_due_at?: string;
  is_overdue: boolean;
  days_overdue: number;
}

interface BalancesResponse {
  sellers: SellerBalance[];
  total: number;
  totals: {
    total_outstanding: string;
    total_overdue: string;
    total_collected: string;
  };
}

interface Invoice {
  public_id: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  status: string;
  due_at: string;
  is_overdue: boolean;
}

interface HistoryInvoice extends Invoice {
  seller_public_id: string;
  seller_name: string;
  seller_phone: string;
  paid_at?: string;
  payment_method?: string;
  payment_reference?: string;
  waived_reason?: string;
  recorded_by_name?: string;
}

interface HistoryResponse {
  invoices: HistoryInvoice[];
  total: number;
  totals: BalancesResponse['totals'];
}

const PAYMENT_METHODS = [
  { value: 'vodafone_cash', label: 'فودافون كاش' },
  { value: 'instapay', label: 'إنستاباي' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'cash', label: 'نقداً' },
  { value: 'other', label: 'أخرى' },
];

function money(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function AdminCommissionsPage() {
  const { handleError } = useApiError();
  const [data, setData] = useState<BalancesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Payment dialog state. The seller's invoices are fetched only when their row
  // is opened — the list itself is a summary and does not carry them.
  const [paying, setPaying] = useState<SellerBalance | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [method, setMethod] = useState('vodafone_cash');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reminding, setReminding] = useState<string | null>(null);

  // Two different questions, so two different lists: "who owes me money" is a
  // worklist of unpaid invoices, while the history is the record of what was
  // collected — which the worklist drops the moment an invoice is paid.
  const [tab, setTab] = useState<'due' | 'history'>('due');
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    if (tab === 'history') {
      api
        .get<HistoryResponse>(`/admin/commissions/history?page=${page}&page_size=${PAGE_SIZE}`)
        .then(setHistory)
        .catch(handleError)
        .finally(() => setLoading(false));
      return;
    }
    const filter = overdueOnly ? '&filter=overdue' : '';
    api
      .get<BalancesResponse>(`/admin/commissions?page=${page}&page_size=${PAGE_SIZE}${filter}`)
      .then(setData)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, [page, overdueOnly, tab]);

  useEffect(load, [load]);

  const openSeller = async (seller: SellerBalance) => {
    setPaying(seller);
    setInvoices([]);
    setReference('');
    setMethod('vodafone_cash');
    setInvoicesLoading(true);
    try {
      const d = await api.get<{ invoices: Invoice[] }>(
        `/admin/commissions/sellers/${seller.seller_public_id}`
      );
      setInvoices((d.invoices || []).filter((i) => i.status === 'unpaid'));
    } catch (err) {
      handleError(err);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const markPaid = async (invoiceId: string) => {
    setSubmitting(true);
    try {
      await api.post(`/admin/commissions/invoices/${invoiceId}/pay`, {
        method,
        reference,
      });
      toast.success('تم تسجيل الدفعة');
      setInvoices((prev) => prev.filter((i) => i.public_id !== invoiceId));
      load();
    } catch (err) {
      handleError(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Ignores the automatic cadence on purpose: an admin pressing this has a
  // reason. It still stamps the invoice, so the scheduled reminder moves out
  // rather than arriving right behind this one.
  const remind = async (invoiceId: string) => {
    setReminding(invoiceId);
    try {
      await api.post(`/admin/commissions/invoices/${invoiceId}/remind`, {});
      toast.success('تم إرسال التذكير');
    } catch (err) {
      handleError(err);
    } finally {
      setReminding(null);
    }
  };

  // Both tabs paginate over their own list, and both responses carry the header
  // totals so the figures are right whichever tab was opened first.
  const total = tab === 'history' ? history?.total ?? 0 : data?.total ?? 0;
  const totals = (tab === 'history' ? history?.totals : data?.totals) ?? {
    total_outstanding: '0', total_overdue: '0', total_collected: '0',
  };

  return (
    <div className="space-y-6" dir="rtl">
      <AdminPageHeader title="العمولات" />

      {/* The three figures an admin actually needs: what is owed, what is late,
          and what has been collected. */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">إجمالي المستحق</p>
            <p className="mt-1 text-2xl font-bold">
              {loading ? <Skeleton className="h-8 w-24" /> : money(totals.total_outstanding)}
            </p>
          </CardContent>
        </Card>
        <Card className={Number(totals.total_overdue) > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">متأخر السداد</p>
            <p className="mt-1 text-2xl font-bold text-red-600">
              {loading ? <Skeleton className="h-8 w-24" /> : money(totals.total_overdue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">تم تحصيله</p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {loading ? <Skeleton className="h-8 w-24" /> : money(totals.total_collected)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant={tab === 'due' ? 'default' : 'outline'} size="sm"
            onClick={() => { setTab('due'); setPage(1); }}>
            المستحقات
          </Button>
          <Button variant={tab === 'history' ? 'default' : 'outline'} size="sm"
            onClick={() => { setTab('history'); setPage(1); }}>
            سجل التحصيل
          </Button>
        </div>

        {tab === 'due' && (
          <div className="flex gap-2">
            <Button variant={overdueOnly ? 'outline' : 'secondary'} size="sm"
              onClick={() => { setOverdueOnly(false); setPage(1); }}>
              الكل
            </Button>
            <Button variant={overdueOnly ? 'secondary' : 'outline'} size="sm"
              onClick={() => { setOverdueOnly(true); setPage(1); }}>
              المتأخرون فقط
            </Button>
          </div>
        )}
      </div>

      {tab === 'history' ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>البائع</TableHead>
                  <TableHead>الأسبوع</TableHead>
                  <TableHead>المبلغ</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>طريقة السداد</TableHead>
                  <TableHead>تاريخ التحصيل</TableHead>
                  <TableHead>سجّلها</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7}><Skeleton className="h-10 w-full" /></TableCell>
                  </TableRow>
                ) : (history?.invoices.length ?? 0) === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      لم يتم تحصيل أي عمولات بعد
                    </TableCell>
                  </TableRow>
                ) : (
                  history?.invoices.map((inv) => (
                    <TableRow key={inv.public_id}>
                      <TableCell>
                        <Link to={`/admin/users/${inv.seller_public_id}`} className="font-medium hover:underline">
                          {inv.seller_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(inv.period_start).toLocaleDateString('ar-EG')} —{' '}
                        {new Date(inv.period_end).toLocaleDateString('ar-EG')}
                      </TableCell>
                      <TableCell className="font-bold">{money(inv.total_amount)}</TableCell>
                      <TableCell>
                        {inv.status === 'paid' ? (
                          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            مدفوعة
                          </span>
                        ) : (
                          // The reason is the whole point of a write-off: without
                          // it a waived invoice is indistinguishable from a mistake.
                          <span
                            className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600"
                            title={inv.waived_reason}
                          >
                            ملغاة
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {inv.payment_method
                          ? PAYMENT_METHODS.find((m) => m.value === inv.payment_method)?.label ?? inv.payment_method
                          : '—'}
                        {inv.payment_reference && (
                          <span className="block text-[10px] text-muted-foreground" dir="ltr">
                            {inv.payment_reference}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString('ar-EG') : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {inv.recorded_by_name || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>البائع</TableHead>
                <TableHead>الهاتف</TableHead>
                <TableHead>المستحق</TableHead>
                <TableHead>الفواتير</TableHead>
                <TableHead>التأخير</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell>
                </TableRow>
              ) : (data?.sellers.length ?? 0) === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                    لا توجد مستحقات
                  </TableCell>
                </TableRow>
              ) : (
                data?.sellers.map((s) => (
                  <TableRow key={s.seller_public_id} className={s.is_overdue ? 'bg-red-50/50' : ''}>
                    <TableCell>
                      <Link to={`/admin/users/${s.seller_public_id}`} className="font-medium hover:underline">
                        {s.name}
                      </Link>
                      {s.account_status !== 'active' && (
                        <span className="ms-2 rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold">
                          {s.account_status}
                        </span>
                      )}
                    </TableCell>
                    <TableCell dir="ltr" className="text-start">
                      <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 hover:underline">
                        <Phone className="h-3 w-3" />{s.phone}
                      </a>
                    </TableCell>
                    <TableCell className="font-bold">{money(s.outstanding)}</TableCell>
                    <TableCell>{s.unpaid_invoices}</TableCell>
                    <TableCell>
                      {s.is_overdue ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          {s.days_overdue} يوم
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openSeller(s)}>
                        تسجيل دفعة
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {total > PAGE_SIZE && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            السابق
          </Button>
          <span className="px-3 py-1.5 text-sm">
            {page} / {Math.ceil(total / PAGE_SIZE)}
          </span>
          <Button variant="outline" size="sm"
            disabled={page >= Math.ceil(total / PAGE_SIZE)}
            onClick={() => setPage((p) => p + 1)}>
            التالي
          </Button>
        </div>
      )}

      <Dialog open={!!paying} onOpenChange={(open) => !open && setPaying(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تسجيل دفعة — {paying?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">طريقة السداد</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">رقم العملية (اختياري)</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مرجع التحويل"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium">الفواتير غير المدفوعة</p>
              {invoicesLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا توجد فواتير غير مدفوعة</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <div key={inv.public_id}
                      className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{money(inv.total_amount)} ج.م</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(inv.period_start).toLocaleDateString('ar-EG')} —{' '}
                          {new Date(inv.period_end).toLocaleDateString('ar-EG')}
                          {inv.is_overdue && <span className="ms-2 text-red-600">متأخرة</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={reminding === inv.public_id}
                          onClick={() => remind(inv.public_id)}
                        >
                          {reminding === inv.public_id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <><Bell className="me-1 h-3 w-3" />تذكير</>}
                        </Button>
                        <Button size="sm" disabled={submitting} onClick={() => markPaid(inv.public_id)}>
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تم السداد'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Blocking is deliberately not a button here. It happens on the user
                page, where the reason is recorded with the rest of the account
                history — one place an account is disabled, one audit trail. */}
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              لحظر الحساب عند الامتناع عن السداد، افتح صفحة المستخدم من اسمه في الجدول.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaying(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
