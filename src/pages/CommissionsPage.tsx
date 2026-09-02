import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Loader2, Receipt, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';

interface Invoice {
  public_id: string;
  period_start: string;
  period_end: string;
  total_amount: string;
  status: string;
  issued_at: string;
  due_at: string;
  is_overdue: boolean;
}

interface Summary {
  outstanding: string;
  accruing: string;
  overdue_count: number;
  rate_percent: string;
  invoices: Invoice[];
}

const statusText: Record<string, string> = {
  unpaid: 'بانتظار السداد',
  paid: 'مدفوعة',
  waived: 'ملغاة',
};

const statusColor: Record<string, string> = {
  unpaid: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  paid: 'bg-green-50 text-green-700 border-green-200',
  waived: 'bg-gray-100 text-gray-500 border-gray-200',
};

// Amounts arrive as strings so nothing rounds in transit; this only groups the
// digits for reading and never re-computes the value.
function money(value: string): string {
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function dateRange(from: string, to: string): string {
  const f = new Date(from);
  const t = new Date(to);
  const fmt = (d: Date) => d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
  return `${fmt(f)} — ${fmt(t)}`;
}

export function CommissionsPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Summary>('/commissions/summary')
      .then(setSummary)
      .catch(handleError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  const outstanding = summary?.outstanding ?? '0.00';
  const hasDebt = Number(outstanding) > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-4 pt-12 pb-8 text-white">
        <div className="mb-4 flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="rounded-full bg-white/20 p-1.5">
            <ChevronRight size={20} />
          </button>
          <h1 className="text-lg font-extrabold">عمولة المنصة</h1>
        </div>

        <p className="text-xs text-white/80">المستحق عليك الآن</p>
        <p className="mt-1 text-4xl font-extrabold">{money(outstanding)}</p>
        <p className="mt-1 text-xs text-white/80">جنيه مصري</p>

        {(summary?.overdue_count ?? 0) > 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/90 px-3 py-2">
            <AlertTriangle size={16} className="shrink-0" />
            <p className="text-xs font-bold">
              لديك {summary?.overdue_count} فاتورة متأخرة — يرجى التواصل مع الإدارة للسداد
            </p>
          </div>
        )}
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* Kept visually separate from the total above: this is this week's
            sales, which are not billed yet and not due. Merging the two numbers
            would make sellers think they owe money they do not owe. */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500">مبيعات هذا الأسبوع</p>
              <p className="mt-0.5 text-[11px] text-gray-400">
                لم تُصدر فاتورتها بعد — نسبة المنصة {summary?.rate_percent}%
              </p>
            </div>
            <p className="text-lg font-extrabold text-gray-900">{money(summary?.accruing ?? '0')}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-bold text-gray-700">الفواتير</h2>

          {(summary?.invoices?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center">
              <Receipt className="mx-auto mb-2 text-gray-300" size={32} />
              <p className="text-sm font-bold text-gray-500">لا توجد فواتير بعد</p>
              <p className="mt-1 text-xs text-gray-400">
                تصدر الفاتورة أسبوعياً على مبيعاتك المكتملة
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {summary?.invoices.map((inv) => (
                <div
                  key={inv.public_id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${
                    inv.is_overdue ? 'border-red-200' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {dateRange(inv.period_start, inv.period_end)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {inv.status === 'unpaid'
                          ? `الاستحقاق ${new Date(inv.due_at).toLocaleDateString('ar-EG')}`
                          : statusText[inv.status]}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-base font-extrabold text-gray-900">
                        {money(inv.total_amount)}
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          inv.is_overdue
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : statusColor[inv.status]
                        }`}
                      >
                        {inv.is_overdue ? 'متأخرة' : statusText[inv.status] || inv.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {hasDebt && (
          <p className="rounded-2xl bg-gray-100 p-3 text-center text-[11px] leading-relaxed text-gray-500">
            سيتم التواصل معك من إدارة المنصة لتحصيل العمولة وتحديد طريقة السداد.
          </p>
        )}
      </div>
    </div>
  );
}
