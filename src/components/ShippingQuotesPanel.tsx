import { useEffect, useState } from 'react';
import { Loader2, Truck, Check, X, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';

interface MerchantQuote {
  public_id: string;
  carrier_name: string;
  // Withheld by the API until this quote is accepted — comparing prices does not
  // require anyone's phone number.
  carrier_phone?: string;
  carrier_logo?: string;
  carrier_notes?: string;
  price: string;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
}

interface QuotesResponse {
  quotes: MerchantQuote[];
  stage: 'order' | 'post' | 'both';
}

type JobKind = 'order' | 'sell-auction' | 'buy-request';

const endpoint: Record<JobKind, string> = {
  order: 'orders',
  'sell-auction': 'sell-auctions',
  'buy-request': 'buy-requests',
};

/**
 * Shipping quotes on one deal, for the merchant who owns it (#14).
 *
 * Renders nothing at all when no carrier has quoted: an empty "shipping" box on
 * every order would be worse than silence, the same reasoning the removed
 * directory panel used.
 */
export function ShippingQuotesPanel({ kind, publicId }: { kind: JobKind; publicId: string }) {
  const { handleError } = useApiError();
  const [quotes, setQuotes] = useState<MerchantQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = () => {
    api
      .get<QuotesResponse>(`/${endpoint[kind]}/${publicId}/shipping-quotes`)
      .then((d) => setQuotes(d.quotes || []))
      // Silent: quotes are an addition to the screen and must never break it.
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [kind, publicId]);

  const act = async (q: MerchantQuote, action: 'accept' | 'reject') => {
    setActing(q.public_id);
    try {
      await api.post(`/shipping-quotes/${q.public_id}/${action}`, {});
      toast.success(action === 'accept' ? 'تم قبول عرض الشحن' : 'تم رفض العرض');
      load();
    } catch (err) {
      handleError(err);
    } finally {
      setActing(null);
    }
  };

  if (loading || quotes.length === 0) return null;

  const accepted = quotes.find((q) => q.status === 'accepted');

  return (
    <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Truck size={16} className="text-green-600" />
        <h3 className="text-sm font-bold text-gray-900">عروض الشحن</h3>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
          {quotes.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {quotes.map((q) => (
          <div
            key={q.public_id}
            className={`rounded-xl border p-3 ${
              q.status === 'accepted'
                ? 'border-green-200 bg-green-50'
                : q.status === 'rejected'
                  ? 'border-gray-200 bg-gray-50 opacity-70'
                  : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{q.carrier_name}</p>
                {q.carrier_notes && (
                  <p className="truncate text-[11px] text-gray-500">{q.carrier_notes}</p>
                )}
                {q.notes && <p className="mt-0.5 text-[11px] text-gray-600">{q.notes}</p>}
              </div>
              <div className="shrink-0 text-end">
                <p className="text-base font-extrabold text-green-600">{q.price}</p>
                <p className="text-[10px] font-bold text-gray-400">جنيه</p>
              </div>
            </div>

            {/* Contact details arrive with acceptance — that is the exchange. */}
            {q.status === 'accepted' && q.carrier_phone && (
              <a
                href={`tel:${q.carrier_phone}`}
                dir="ltr"
                className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-bold text-green-700 border border-green-200"
              >
                <Phone size={12} />
                {q.carrier_phone}
              </a>
            )}

            {q.status === 'pending' && !accepted && (
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={() => act(q, 'accept')}
                  disabled={acting === q.public_id}
                  className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-600 text-xs font-bold text-white disabled:opacity-60"
                >
                  {acting === q.public_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check size={14} /> قبول
                    </>
                  )}
                </button>
                <button
                  onClick={() => act(q, 'reject')}
                  disabled={acting === q.public_id}
                  className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 text-xs font-bold text-red-600 disabled:opacity-60"
                >
                  <X size={14} /> رفض
                </button>
              </div>
            )}

            {q.status === 'rejected' && (
              <p className="mt-1.5 text-[10px] font-bold text-gray-500">تم رفض هذا العرض</p>
            )}
          </div>
        ))}
      </div>

      {accepted && (
        <p className="mt-3 rounded-xl bg-green-50 p-2.5 text-[11px] font-bold text-green-700">
          تم اختيار {accepted.carrier_name} لشحن هذه الصفقة — تواصل معه لترتيب الاستلام.
        </p>
      )}
    </div>
  );
}
