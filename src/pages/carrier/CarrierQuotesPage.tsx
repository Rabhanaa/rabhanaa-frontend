import { useEffect, useState } from 'react';
import { Loader2, Coins, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';

interface Quote {
  public_id: string;
  job_kind: 'order' | 'sell_auction' | 'buy_request';
  job_public_id: string;
  job_title: string;
  job_region: string;
  price: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  created_at: string;
}

const statusText: Record<Quote['status'], string> = {
  pending: 'بانتظار الرد',
  accepted: 'مقبول',
  rejected: 'لم يتم اختياره',
  withdrawn: 'مسحوب',
};

const statusColor: Record<Quote['status'], string> = {
  pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  accepted: 'text-green-700 bg-green-50 border-green-200',
  rejected: 'text-gray-600 bg-gray-100 border-gray-200',
  withdrawn: 'text-gray-500 bg-gray-100 border-gray-200',
};

export function CarrierQuotesPage() {
  const { handleError } = useApiError();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  // See CarrierJobsPage: load sets nothing synchronously, so the mount effect
  // does not force a second render before the request starts.
  const load = () =>
    api
      .get<{ quotes: Quote[]; total: number }>('/carrier/quotes?page_size=30')
      .then((d) => setQuotes(d.quotes || []))
      .catch(handleError)
      .finally(() => setLoading(false));

  const refresh = () => {
    setLoading(true);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  const withdraw = async (q: Quote) => {
    try {
      await api.delete(`/carrier/quotes/${q.public_id}`);
      toast.success('تم سحب العرض');
      refresh();
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="px-4 pt-6">
        <h1 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Coins size={22} className="text-green-600" /> عروضي
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="space-y-2 py-14 text-center">
            <Coins size={44} className="mx-auto text-gray-300" />
            <p className="text-base font-bold text-gray-900">لم تقدم أي عروض بعد</p>
            <p className="text-sm text-gray-500">تصفح الشحنات المتاحة وقدّم سعرك</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((q) => (
              <div key={q.public_id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="line-clamp-1 text-sm font-bold text-gray-900">
                    {q.job_title || 'شحنة'}
                  </h3>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusColor[q.status]}`}
                  >
                    {statusText[q.status]}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-500">سعرك</p>
                    <p className="text-lg font-extrabold text-green-600">
                      {q.price} <span className="text-xs font-bold text-gray-400">جنيه</span>
                    </p>
                    {q.job_region && (
                      <p className="mt-0.5 text-[11px] text-gray-500">{q.job_region}</p>
                    )}
                  </div>

                  {/* Only a quote nobody has answered can be taken back — pulling
                      out of an accepted one would strand the merchant. */}
                  {q.status === 'pending' && (
                    <button
                      onClick={() => withdraw(q)}
                      className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={13} /> سحب
                    </button>
                  )}
                </div>

                {q.notes && <p className="mt-2 text-[11px] text-gray-500">{q.notes}</p>}

                {q.status === 'accepted' && (
                  <p className="mt-2 rounded-xl bg-green-50 p-2.5 text-[11px] font-bold text-green-700">
                    تم قبول عرضك — تواصل مع التاجر لترتيب الاستلام
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
