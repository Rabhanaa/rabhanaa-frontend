import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Clock, Package, ShoppingCart, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { useApiError } from '@/hooks/useApiError';

interface Order {
  public_id: string;
  source_type: 'sell_auction' | 'buy_request';
  seller_name: string; seller_phone: string; seller_region: string;
  buyer_name: string; buyer_phone: string; buyer_region: string;
  final_price: number; unit_price: number; total_price: string; quantity: number; unit: string;
  status: string; confirmation_deadline: string | null; masked_message: string;
  is_seller_confirmed: boolean; is_buyer_confirmed: boolean;
  i_am_seller: boolean; i_am_buyer: boolean; created_at: string;
}

const statusText: Record<string, string> = {
  buyer_confirmed: 'في انتظار تأكيد البائع',
  seller_confirmed: 'في انتظار تأكيد المشتري',
  completed: 'مكتمل', expired: 'منتهي', cancelled: 'ملغي',
};

const statusColor: Record<string, string> = {
  buyer_confirmed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  seller_confirmed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  expired: 'bg-gray-100 text-gray-500 border-gray-200',
  cancelled: 'bg-red-50 text-red-600 border-red-200',
};

export function OrdersPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming'>('outgoing');
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const fetchOrders = async (pageNum = 1, append = false) => {
      try {
        if (!append) setLoading(true); else setLoadingMore(true);
        const params = new URLSearchParams({ page: pageNum.toString(), page_size: '20' });
        const data = await api.get<{ orders: Order[]; total: number }>(`/orders?${params}`);
        setOrders((prev) => append ? [...prev, ...(data.orders || [])] : (data.orders || []));
        setTotal(data.total || 0);
      } catch { handleError(new Error('فشل تحميل الطلبات')); }
      finally { setLoading(false); setLoadingMore(false); }
    };
    fetchOrders(page);
  }, [page]);

  const getTimeRemaining = (deadline: string | null) => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return null;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}ي ${hours % 24}س`;
    if (hours > 0) return `${hours}س ${minutes % 60}د`;
    return `${minutes}د`;
  };

  const filteredOrders = orders.filter(o => 
    activeTab === 'outgoing' ? o.i_am_seller : o.i_am_buyer
  );

  const renderOrderCard = (order: Order) => {
    const counterparty = order.i_am_buyer
      ? { label: 'البائع', name: order.seller_name || order.masked_message, region: order.seller_region }
      : { label: 'المشتري', name: order.buyer_name || order.masked_message, region: order.buyer_region };

    const timeRemaining = getTimeRemaining(order.confirmation_deadline);
    const isUrgent = timeRemaining && timeRemaining.includes('د') && !timeRemaining.includes('س');

    return (
      <div
        key={order.public_id}
        onClick={() => navigate(`/orders/${order.public_id}`)}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${order.source_type === 'sell_auction' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
              {order.source_type === 'sell_auction' ? <Package size={9} /> : <ShoppingCart size={9} />}
              {order.source_type === 'sell_auction' ? 'عرض بيع' : 'طلب شراء'}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor[order.status] || 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {statusText[order.status] || order.status}
            </span>
          </div>
          {timeRemaining && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${isUrgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
              <Clock size={9} />{timeRemaining}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-bold">{counterparty.label}</p>
            <p className="font-bold text-gray-900 text-sm mt-0.5">{counterparty.name}</p>
            <p className="text-xs text-gray-500">{counterparty.region}</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 font-bold">إجمالي الصفقة</p>
            <p className="text-xl font-extrabold text-green-600">
              {formatMoney(order.total_price)} <span className="text-xs font-bold text-gray-400">ج.م</span>
            </p>
            <p className="text-xs text-gray-500">{order.quantity} {order.unit} × {formatMoney(order.unit_price)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-gray-50 pt-2">
          <span className={`flex items-center gap-1 text-[10px] font-bold ${order.is_seller_confirmed ? 'text-green-600' : 'text-gray-400'}`}>
            {order.is_seller_confirmed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            البائع
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-bold ${order.is_buyer_confirmed ? 'text-green-600' : 'text-gray-400'}`}>
            {order.is_buyer_confirmed ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
            المشتري
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Package size={22} className="text-green-600" /> الطلبات
        </h1>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'outgoing'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            طلبات سيتم ارسالها
          </button>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'incoming'
                ? 'bg-green-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            طلبات ستصلني
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 animate-in fade-in slide-in-from-bottom-4 space-y-4">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-900 font-bold text-base">لا توجد طلبات بعد</p>
            <p className="text-gray-500 text-sm">ابدأ بالمزايدة على المزادات للحصول على طلباتك</p>
            <button
              onClick={() => navigate('/auctions')}
              className="w-full max-w-xs h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold mx-auto block transition-colors"
            >
              تصفّح المزادات
            </button>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4">
            {filteredOrders.map(renderOrderCard)}
          </div>
        )}

        {!loading && !loadingMore && orders.length < total && (
          <button onClick={() => setPage((p) => p + 1)} className="w-full h-12 rounded-2xl border-2 border-green-600 text-green-600 font-bold text-sm hover:bg-green-50 transition-colors">
            تحميل المزيد
          </button>
        )}
        {loadingMore && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>}
      </div>
    </div>
  );
}
