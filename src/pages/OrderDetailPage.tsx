import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShippingQuotesPanel } from '@/components/ShippingQuotesPanel';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Clock, Package, ShoppingCart, CheckCircle2, XCircle, ChevronRight, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/utils';
import { useApiError } from '@/hooks/useApiError';

interface Order {
  public_id: string; source_type: 'sell_auction' | 'buy_request';
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

export function OrderDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { handleError } = useApiError();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    api.get<Order>(`/orders/${publicId}`)
      .then(setOrder).catch(() => handleError(new Error('فشل تحميل الطلب'))).finally(() => setLoading(false));
  }, [publicId]);

  useEffect(() => {
    if (!order?.confirmation_deadline) return;
    const deadline = order.confirmation_deadline;
    const updateTime = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('انتهت مهلة التأكيد'); return; }
      const m = Math.floor(diff / 60000);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      if (d > 0) setTimeLeft(`${d} يوم ${h % 24} ساعة`);
      else if (h > 0) setTimeLeft(`${h} ساعة ${m % 60} دقيقة`);
      else setTimeLeft(`${m} دقيقة`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [order?.confirmation_deadline]);

  const handleConfirm = async () => {
    if (!order) return;
    setSubmitting(true);
    try {
      await api.post(`/orders/${order.public_id}/confirm`, {});
      const updated = await api.get<Order>(`/orders/${order.public_id}`);
      setOrder(updated); setShowConfirmDialog(false);
    } catch { handleError(new Error('فشل تأكيد الطلب')); }
    finally { setSubmitting(false); }
  };

  const canConfirm = () => {
    if (!order) return false;
    if (timeLeft === 'انتهت مهلة التأكيد' || order.status === 'completed' || order.status === 'cancelled') return false;
    if (order.i_am_seller && !order.is_seller_confirmed) return true;
    if (order.i_am_buyer && !order.is_buyer_confirmed) return true;
    return false;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  if (!order) return null;

  const isExpiredDeadline = timeLeft === 'انتهت مهلة التأكيد';
  const isCompleted = order.status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* 13.1 — Header */}
      <div className="bg-white px-4 pt-10 pb-4 border-b border-gray-100 flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronRight size={26} className="text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">تفاصيل الطلب</h1>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* 13.2 — Status card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border ${order.source_type === 'sell_auction' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                {order.source_type === 'sell_auction' ? <Package size={11} /> : <ShoppingCart size={11} />}
                {order.source_type === 'sell_auction' ? 'عرض بيع' : 'طلب شراء'}
              </span>
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${isCompleted ? 'bg-green-50 text-green-700 border-green-200' : isExpiredDeadline || order.status === 'expired' || order.status === 'cancelled' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                {statusText[order.status] || order.status}
              </span>
            </div>
            {timeLeft && (
              <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border ${isExpiredDeadline ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                <Clock size={12} />{timeLeft}
              </span>
            )}
          </div>

          {/* Confirmation status */}
          <div className="flex items-center gap-4 border-t border-gray-50 pt-3">
            <div className={`flex items-center gap-1.5 text-sm font-bold ${order.is_seller_confirmed ? 'text-green-600' : 'text-gray-400'}`}>
              {order.is_seller_confirmed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              البائع
            </div>
            <div className={`flex items-center gap-1.5 text-sm font-bold ${order.is_buyer_confirmed ? 'text-green-600' : 'text-gray-400'}`}>
              {order.is_buyer_confirmed ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              المشتري
            </div>
          </div>
        </div>

        {/* 13.3 — Product info card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h3 className="font-bold text-gray-900">معلومات المنتج</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 font-bold mb-1">الكمية</p>
              <p className="font-bold text-gray-900">{order.quantity} {order.unit}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
              <p className="text-xs text-gray-500 font-bold mb-1">إجمالي الصفقة</p>
              <p className="text-lg font-extrabold text-green-600">
                {formatMoney(order.total_price)} <span className="text-xs">ج.م</span>
              </p>
            </div>
          </div>
          {order.unit_price && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 font-bold">السعر للوحدة</span>
              <span className="font-bold text-gray-700">{formatMoney(order.unit_price)} ج.م / {order.unit}</span>
            </div>
          )}
        </div>

        {/* 13.4 — Seller info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><Package size={16} className="text-green-600" />البائع</h3>
          <p className="font-bold text-gray-900">{order.seller_name || order.masked_message}</p>
          <p className="text-sm text-gray-500">{order.seller_region}</p>
          {isCompleted && order.seller_phone && (
            <a href={`tel:${order.seller_phone}`} className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-2 rounded-xl border border-green-100 w-fit">
              <Phone size={14} />{order.seller_phone}
            </a>
          )}
        </div>

        {/* 13.5 — Buyer info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2"><ShoppingCart size={16} className="text-orange-500" />المشتري</h3>
          <p className="font-bold text-gray-900">{order.buyer_name || order.masked_message}</p>
          <p className="text-sm text-gray-500">{order.buyer_region}</p>
          {isCompleted && order.buyer_phone && (
            <a href={`tel:${order.buyer_phone}`} className="flex items-center gap-2 text-green-600 font-bold text-sm bg-green-50 px-3 py-2 rounded-xl border border-green-100 w-fit">
              <Phone size={14} />{order.buyer_phone}
            </a>
          )}
        </div>

        {/* 13.6 — Confirm button */}
        {canConfirm() && (
          <button
            onClick={() => setShowConfirmDialog(true)}
            className="w-full h-14 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-2xl font-bold text-base shadow-lg transition-all"
          >
            تأكيد الطلب
          </button>
        )}

        {/* Carrier prices for this deal (#14). Renders nothing until one arrives. */}
        {publicId && <ShippingQuotesPanel kind="order" publicId={publicId} />}
      </div>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">تأكيد الطلب</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من تأكيد هذا الطلب؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={submitting} className="rounded-xl bg-green-600 hover:bg-green-700">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
