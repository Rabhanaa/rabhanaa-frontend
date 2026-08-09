import { useEffect, useState } from 'react';
import { Loader2, Coins, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useApiError } from '@/hooks/useApiError';

interface SellBid {
  public_id: string; bidder_name: string; bidder_region: string;
  amount: string; is_selected: boolean; is_my_bid: boolean; created_at: string;
  auction_title: string; auction_unit_price: string; auction_quantity: string; auction_unit: string;
}

interface SupplyOffer {
  public_id: string; supplier_name: string; supplier_region: string;
  price_per_unit: number; offered_quantity: number;
  is_accepted: boolean; is_my_offer: boolean; created_at: string;
}

export function MyBidsPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [activeTab, setActiveTab] = useState<'sell' | 'supply'>('sell');
  const [sellBids, setSellBids] = useState<SellBid[]>([]);
  const [sellPage, setSellPage] = useState(1);
  const [sellTotal, setSellTotal] = useState(0);
  const [sellLoading, setSellLoading] = useState(true);
  const [sellLoadingMore, setSellLoadingMore] = useState(false);
  const [supplyOffers, setSupplyOffers] = useState<SupplyOffer[]>([]);
  const [supplyPage, setSupplyPage] = useState(1);
  const [supplyTotal, setSupplyTotal] = useState(0);
  const [supplyLoading, setSupplyLoading] = useState(true);
  const [supplyLoadingMore, setSupplyLoadingMore] = useState(false);

  useEffect(() => {
    const fetch = async (page = 1, append = false) => {
      try {
        if (!append) setSellLoading(true); else setSellLoadingMore(true);
        const params = new URLSearchParams({ page: page.toString(), page_size: '20' });
        const data = await api.get<{ bids: SellBid[]; total: number }>(`/my-bids/sell?${params}`);
        setSellBids((prev) => append ? [...prev, ...(data.bids || [])] : (data.bids || []));
        setSellTotal(data.total || 0);
      } catch { handleError(new Error('فشل تحميل عروض المزايدة')); }
      finally { setSellLoading(false); setSellLoadingMore(false); }
    };
    fetch(sellPage);
  }, [sellPage]);

  useEffect(() => {
    const fetch = async (page = 1, append = false) => {
      try {
        if (!append) setSupplyLoading(true); else setSupplyLoadingMore(true);
        const params = new URLSearchParams({ page: page.toString(), page_size: '20' });
        const data = await api.get<{ offers: SupplyOffer[]; total: number }>(`/my-bids/supply?${params}`);
        setSupplyOffers((prev) => append ? [...prev, ...(data.offers || [])] : (data.offers || []));
        setSupplyTotal(data.total || 0);
      } catch { handleError(new Error('فشل تحميل عروض التوريد')); }
      finally { setSupplyLoading(false); setSupplyLoadingMore(false); }
    };
    fetch(supplyPage);
  }, [supplyPage]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Coins size={22} className="text-green-600" /> عرض اسعاري
        </h1>
        <p className="text-gray-500 text-sm">هذه كل الصفقات التي قدمت عرض سعر عليها</p>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* 11.1 — Pill tabs */}
        <div className="flex p-1 bg-white rounded-2xl border border-gray-200">
          <button onClick={() => setActiveTab('sell')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'sell' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-500'}`}>
           معروض للبيع
          </button>
          <button onClick={() => setActiveTab('supply')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'supply' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500'}`}>
            عروض التوريد
          </button>
        </div>

        {/* 11.2 — Sell bids */}
        {activeTab === 'sell' && (
          <div className="space-y-3">
            {sellLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
            ) : sellBids.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Coins size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-bold text-base">لا توجد عروض بعد</p>
                <p className="text-gray-500 text-sm">تصفّح الصفقات وابدأ بتقديم العروض</p>
                <button
                  onClick={() => navigate('/auctions')}
                  className="w-full max-w-xs h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold mx-auto block transition-colors"
                >
                  تصفّح الصفقات
                </button>
              </div>
            ) : (
              sellBids.map((bid) => (
                <div key={bid.public_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-700 text-xs mb-1">{bid.auction_title}</p>
                      <p className="text-[10px] text-gray-500 mb-1">سعر الوحدة: {bid.auction_unit_price} | الكمية: {bid.auction_quantity} {bid.auction_unit}</p>
                      <p className="font-bold text-gray-900 text-sm">{bid.bidder_name || 'أنت'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{bid.bidder_region || '—'}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(bid.created_at).toLocaleString('ar-EG')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xl font-extrabold text-green-600">{bid.amount} <span className="text-xs font-bold text-gray-400">ج.م</span></span>
                      {bid.is_selected ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                          <CheckCircle2 size={10} />تم اختيارك
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">بانتظار الاختيار</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {!sellLoading && !sellLoadingMore && sellBids.length < sellTotal && (
              <button onClick={() => setSellPage((p) => p + 1)} className="w-full h-12 rounded-2xl border-2 border-green-600 text-green-600 font-bold text-sm hover:bg-green-50 transition-colors">
                تحميل المزيد
              </button>
            )}
            {sellLoadingMore && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>}
          </div>
        )}

        {/* Supply offers */}
        {activeTab === 'supply' && (
          <div className="space-y-3">
            {supplyLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>
            ) : supplyOffers.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Coins size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-bold text-base">لا توجد عروض بعد</p>
                <p className="text-gray-500 text-sm">تصفّح الصفقات وابدأ بتقديم العروض</p>
                <button
                  onClick={() => navigate('/auctions')}
                  className="w-full max-w-xs h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold mx-auto block transition-colors"
                >
                  تصفّح الصفقات
                </button>
              </div>
            ) : (
              supplyOffers.map((offer) => (
                <div key={offer.public_id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{offer.supplier_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{offer.supplier_region}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(offer.created_at).toLocaleString('ar-EG')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xl font-extrabold text-orange-600">{offer.price_per_unit} <span className="text-xs text-gray-400 font-bold">/وحدة</span></span>
                      <span className="text-xs text-gray-500">الكمية: {offer.offered_quantity}</span>
                      {offer.is_accepted ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                          <CheckCircle2 size={10} />تم القبول
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">بانتظار القبول</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {!supplyLoading && !supplyLoadingMore && supplyOffers.length < supplyTotal && (
              <button onClick={() => setSupplyPage((p) => p + 1)} className="w-full h-12 rounded-2xl border-2 border-orange-500 text-orange-500 font-bold text-sm hover:bg-orange-50 transition-colors">
                تحميل المزيد
              </button>
            )}
            {supplyLoadingMore && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>}
          </div>
        )}
      </div>
    </div>
  );
}
