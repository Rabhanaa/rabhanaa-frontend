import { useEffect, useState } from 'react';
import { Loader2, Package, MapPin, Tag, Truck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { useAuthStore } from '@/stores/auth';

// What a carrier is shown about a job. There is no price field here and none is
// sent by the API: transport is priced on weight, distance and goods type, so the
// value of the cargo is deliberately not a carrier's business.
interface CarrierJob {
  kind: 'order' | 'sell_auction' | 'buy_request';
  public_id: string;
  title: string;
  interest_name: string;
  quantity: string;
  unit: string;
  from_region: string;
  to_region?: string;
  deadline?: string;
  already_quoted: boolean;
}

interface JobsResponse {
  jobs: CarrierJob[];
  total: number;
  stage: 'order' | 'post' | 'both';
}

const kindLabel: Record<CarrierJob['kind'], string> = {
  order: 'صفقة مكتملة',
  sell_auction: 'عرض بيع',
  buy_request: 'طلب شراء',
};

export function CarrierJobsPage() {
  const { handleError } = useApiError();
  const user = useAuthStore((s) => s.user);
  const [jobs, setJobs] = useState<CarrierJob[]>([]);
  const [stage, setStage] = useState<JobsResponse['stage']>('order');
  const [loading, setLoading] = useState(true);
  const [quoting, setQuoting] = useState<CarrierJob | null>(null);

  // load touches no state synchronously — `loading` already starts true, so the
  // mount pass would otherwise render twice before the request even leaves.
  // refresh is for after an action, where showing the spinner again is right.
  const load = () =>
    api
      .get<JobsResponse>('/carrier/jobs?page_size=30')
      .then((d) => {
        setJobs(d.jobs || []);
        setStage(d.stage);
      })
      .catch(handleError)
      .finally(() => setLoading(false));

  const refresh = () => {
    setLoading(true);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  const pending = user?.status === 'pending_review';

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-5 pb-8 pt-12 text-center rounded-b-[32px] shadow-xl">
        <Truck size={34} className="mx-auto mb-2 text-white" />
        <h1 className="text-2xl font-extrabold text-white">الشحنات المتاحة</h1>
        <p className="mt-1 text-sm text-green-100">
          {stage === 'post'
            ? 'عروض أسعار تقديرية — لم يتم تحديد المشتري بعد'
            : 'صفقات مكتملة تحتاج إلى نقل'}
        </p>
      </div>

      <div className="px-4 pt-5 space-y-3">
        {/* An account waiting on review can look but not quote, so say so once
            here rather than letting every attempt fail with an error. */}
        {pending && (
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm font-bold text-yellow-800">
            حسابك قيد المراجعة — يمكنك تصفح الشحنات، وتقديم العروض بعد موافقة الإدارة.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="space-y-3 py-14 text-center">
            <Truck size={44} className="mx-auto text-gray-300" />
            <p className="text-base font-bold text-gray-900">لا توجد شحنات متاحة حالياً</p>
            <p className="text-sm text-gray-500">
              تظهر هنا الشحنات في المحافظات التي تخدمها فقط — يمكنك تعديلها من ملفك الشخصي.
            </p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={`${job.kind}-${job.public_id}`}
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-bold text-gray-900">{job.title}</h3>
                <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600">
                  {kindLabel[job.kind]}
                </span>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <span className="flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">
                  <Tag size={11} />
                  {job.interest_name}
                </span>
                <span className="flex items-center gap-1 rounded-xl border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600">
                  <Package size={11} />
                  {job.quantity} {job.unit}
                </span>
              </div>

              <div className="mb-3 flex items-center gap-2 text-xs font-bold text-gray-700">
                <MapPin size={13} className="text-green-600" />
                <span>{job.from_region}</span>
                {job.to_region && (
                  <>
                    <ArrowLeft size={13} className="text-gray-400" />
                    <span>{job.to_region}</span>
                  </>
                )}
                {!job.to_region && (
                  <span className="text-[11px] font-medium text-gray-400">
                    — جهة الوصول تُحدد بعد اختيار المشتري
                  </span>
                )}
              </div>

              {job.already_quoted ? (
                <div className="rounded-xl bg-gray-50 py-2.5 text-center text-xs font-bold text-gray-500">
                  تم تقديم عرضك — بانتظار رد التاجر
                </div>
              ) : (
                <button
                  onClick={() => setQuoting(job)}
                  disabled={pending}
                  className="h-11 w-full rounded-xl bg-green-600 text-sm font-bold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {pending ? 'بانتظار موافقة الإدارة' : 'قدّم سعر الشحن'}
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {quoting && (
        <QuoteDialog
          job={quoting}
          onClose={() => setQuoting(null)}
          onDone={() => {
            setQuoting(null);
            toast.success('تم إرسال عرضك — سيصل التاجر إشعار به');
            refresh();
          }}
        />
      )}
    </div>
  );
}

function QuoteDialog({
  job,
  onClose,
  onDone,
}: {
  job: CarrierJob;
  onClose: () => void;
  onDone: () => void;
}) {
  const { handleError } = useApiError();
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const value = parseFloat(price);
    if (!Number.isFinite(value) || value <= 0) return;
    setSaving(true);
    try {
      await api.post(`/carrier/jobs/${job.kind}/${job.public_id}/quotes`, {
        price: value,
        notes: notes.trim() || undefined,
      });
      onDone();
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40 sm:items-center sm:justify-center" dir="rtl">
      <div className="w-full rounded-t-3xl bg-white p-6 sm:max-w-md sm:rounded-3xl">
        <h2 className="mb-1 text-lg font-extrabold text-gray-900">سعر شحن {job.title}</h2>
        <p className="mb-4 text-xs text-gray-500">
          {job.to_region
            ? `من ${job.from_region} إلى ${job.to_region} — ${job.quantity} ${job.unit}`
            : `من ${job.from_region} — ${job.quantity} ${job.unit} (سعر تقديري)`}
        </p>

        <label className="mb-1.5 block text-xs font-bold text-gray-700">السعر (جنيه) *</label>
        <input
          type="number"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="mb-4 h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-base font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          placeholder="0"
          dir="ltr"
        />

        <label className="mb-1.5 block text-xs font-bold text-gray-700">ملاحظات (اختياري)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mb-5 w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm font-bold outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
          placeholder="نوع الشاحنة، مدة التسليم..."
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="h-12 flex-1 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600"
          >
            إلغاء
          </button>
          <button
            onClick={submit}
            disabled={saving || !price}
            className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-green-600 text-sm font-bold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'إرسال العرض'}
          </button>
        </div>
      </div>
    </div>
  );
}
