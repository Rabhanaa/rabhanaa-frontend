import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, Package, MapPin, Tag, CheckCircle2, Loader2, ChevronRight, Send, Gavel } from 'lucide-react';
import { api, getImageUrl } from '@/lib/api';
import { useApiError } from '@/hooks/useApiError';
import { useAuthStore } from '@/stores/auth';
import { isSubscriptionError, isPendingReviewError } from '@/lib/errors';
import { SubscriptionContactDialog } from '@/components/SubscriptionContactDialog';
import { PendingReviewDialog } from '@/components/PendingReviewDialog';
import { trackPixel } from '@/lib/pixel';
import { RegisterPromptDialog } from '@/components/RegisterPromptDialog';

interface BuyRequest {
  public_id: string; region_name: string; interest_name: string; title: string;
  description: string | null; image_url: string | null; unit: string; quantity: number;
  buy_all_from_one: boolean; offer_count: number; accepted_offer_count: number;
  fulfilled_quantity: number; end_time: string; status: string;
  is_owner: boolean; is_expired: boolean; created_at: string;
}

interface Offer {
  public_id: string; supplier_name: string; supplier_region: string;
  price_per_unit: number; offered_quantity: number;
  is_accepted: boolean; is_my_offer: boolean; created_at: string;
}

export function BuyRequestDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  const [request, setRequest] = useState<BuyRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [submittingAccept, setSubmittingAccept] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [submittingOffer, setSubmittingOffer] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showOfferConfirmDialog, setShowOfferConfirmDialog] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [pendingReviewDialogOpen, setPendingReviewDialogOpen] = useState(false);

  useEffect(() => {
    api.get<BuyRequest>(`/buy-requests/${publicId}`)
      .then((d) => { setRequest(d); trackPixel('ViewContent', { content_type: 'buy_request' }); }).catch((e) => handleError(e)).finally(() => setLoading(false));
  }, [publicId]);

  useEffect(() => {
    api.get<{ offers: Offer[] }>(`/buy-requests/${publicId}/offers`)
      .then((d) => setOffers(d.offers || [])).catch(console.error);
  }, [publicId]);

  useEffect(() => {
    if (!request) return;
    const getRemainingTime = () => {
      const diff = new Date(request.end_time).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('منتهي'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 24) setTimeLeft(`${Math.floor(h / 24)} يوم`);
      else if (h > 0) setTimeLeft(`${h}س ${m}د`);
      else if (m > 0) setTimeLeft(`${m}د ${s}ث`);
      else setTimeLeft(`${s}ث`);
    };
    getRemainingTime();
    const t = setInterval(getRemainingTime, 1000);
    return () => clearInterval(t);
  }, [request]);


  const handleAcceptOffer = async (offerId: string) => {
    setSubmittingAccept(true);
    try { await api.post(`/buy-requests/${publicId}/accept`, { offer_public_id: offerId }); setShowAcceptDialog(null); setShowSuccessPopup(true); }
    catch (e) { handleError(e); }
    finally { setSubmittingAccept(false); }
  };

  const handleCancelRequest = async () => {
    setSubmittingCancel(true);
    try { await api.post(`/buy-requests/${publicId}/cancel`, {}); setShowCancelDialog(false); navigate('/my-auctions'); }
    catch (e) { handleError(e); }
    finally { setSubmittingCancel(false); }
  };

  const handleSubmitOffer = async () => {
    if (user?.status === 'pending_review' || user?.status === 'inactive') {
      setShowOfferConfirmDialog(false);
      setPendingReviewDialogOpen(true);
      return;
    }
    setSubmittingOffer(true);
    try {
      await api.post(`/buy-requests/${publicId}/offers`, { price_per_unit: parseFloat(offerPrice) });
      setShowOfferConfirmDialog(false);
      navigate('/my-bids');
    } catch (e) {
      if (isSubscriptionError(e)) {
        setShowOfferConfirmDialog(false);
        setSubscriptionDialogOpen(true);
      } else if (isPendingReviewError(e)) {
        setShowOfferConfirmDialog(false);
        setPendingReviewDialogOpen(true);
      } else {
        handleError(e);
      }
    } finally {
      setSubmittingOffer(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!request) return <div className="min-h-screen flex items-center justify-center p-4 text-red-500 font-bold">Request not found</div>;

  const statusText: Record<string, string> = { active: 'نشط', pending_selection: 'بانتظار الاختيار', completed: 'مكتمل', cancelled: 'ملغي', expired: 'منتهي' };
  const isExpired = timeLeft === 'منتهي';
  const canAcceptOffers = request.is_owner && (request.status === 'active' || request.status === 'pending_selection' || request.status === 'partially_fulfilled') && offers.length > 0;
  const canCancelRequest = request.is_owner && request.status === 'active' && offers.length === 0;
  const canSubmitOffer = !request.is_owner && !request.is_expired && request.status === 'active';

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* 9.1 Hero image */}
      <div className="relative h-72">
        {request.image_url
          ? <img src={getImageUrl(request.image_url) || undefined} alt={request.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <div className="w-full h-full bg-orange-50 flex items-center justify-center"><Package size={64} className="text-orange-300" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-10 end-4 bg-white/80 p-2 rounded-full backdrop-blur-md shadow-md">
          <ChevronRight size={24} className="text-gray-800" />
        </button>
        <span className={`absolute top-10 start-4 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md ${request.status === 'active' ? 'bg-orange-500 text-white' : 'bg-white/80 text-gray-800'}`}>
          {statusText[request.status] || request.status}
        </span>
      </div>

      {/* 9.2 Detail card */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-lg space-y-4">
          <h1 className="text-xl font-bold text-gray-900">{request.title}</h1>

          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl"><Tag size={12} />{request.interest_name}</span>
            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl"><MapPin size={12} />{request.region_name}</span>
            <span className="flex items-center gap-1 bg-orange-50 text-orange-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-orange-100"><Package size={12} />{request.quantity} {request.unit}</span>
          </div>

          {/* Timer & buy_all_from_one */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold ${isExpired ? 'bg-red-50 border-red-200 text-red-600' : 'bg-orange-50 border-orange-200 text-orange-600'}`}>
              <Clock size={14} />{timeLeft}
            </div>
            {request.buy_all_from_one && (
              <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl"><Tag size={12} />الشراء من مورد واحد</span>
            )}
          </div>

          {request.description && <p className="text-gray-500 text-sm leading-relaxed">{request.description}</p>}

          {/* Cancel button for owner */}
          {canCancelRequest && (
            <button onClick={() => setShowCancelDialog(true)} className="w-full h-12 border-2 border-red-500 text-red-600 rounded-2xl font-bold hover:bg-red-50 transition-colors">
              إلغاء الطلب
            </button>
          )}

          {/* 9.4 Offers list */}
          {offers.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-3">
                <Gavel size={16} className="text-orange-500" />العروض
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">{offers.length}</span>
              </h2>
              {/* 9.5 Offer cards */}
              <div className="space-y-3">
                {offers.map((offer, idx) => (
                  <div key={offer.public_id} className={`rounded-2xl p-4 flex items-center justify-between ${idx === 0 && !offer.is_accepted ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                    <div>
                      <p className="font-bold text-gray-900 text-sm flex items-center gap-1">
                        {idx === 0 && <span className="text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded-full font-bold">#1</span>}
                        {offer.supplier_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{offer.supplier_region}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(offer.created_at).toLocaleString('ar-EG')}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {/* 9.3 Orange accent price */}
                      <span className="text-lg font-extrabold text-orange-600">{offer.price_per_unit} <span className="text-xs text-gray-400 font-bold">/{request.unit}</span></span>
                      <span className="text-xs text-gray-500">الكمية: {offer.offered_quantity}</span>
                      {offer.is_accepted && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} />تم القبول</span>
                      )}
                      {request.is_owner && canAcceptOffers && !offer.is_accepted && (
                        <button onClick={() => setShowAcceptDialog(offer.public_id)} className="text-xs font-bold text-white bg-green-600 px-4 py-1.5 rounded-xl hover:bg-green-700">
                          قبول
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplier submit offer */}
          {canSubmitOffer && (
            <div className="pt-2 border-t border-gray-100 space-y-3">
              <h2 className="font-bold text-gray-900">تقديم عرض</h2>
              {/* 9.3 Orange accent input+button */}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="flex-1 h-14 border border-gray-200 rounded-xl px-4 font-bold text-lg outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 bg-white"
                  placeholder="السعر للوحدة"
                  step="0.01" min="0"
                />
                <button
                  onClick={() => (token ? setShowOfferConfirmDialog(true) : setShowRegisterPrompt(true))}
                  disabled={!offerPrice || submittingOffer}
                  className="h-14 px-5 bg-orange-500 text-white rounded-xl font-bold shadow-lg hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 9.6 Dialogs */}
      <AlertDialog open={!!showAcceptDialog} onOpenChange={() => setShowAcceptDialog(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">قبول العرض</AlertDialogTitle>
            <AlertDialogDescription>هل تريد قبول هذا العرض؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => showAcceptDialog && handleAcceptOffer(showAcceptDialog)} disabled={submittingAccept} className="rounded-xl bg-green-600 hover:bg-green-700">
              {submittingAccept ? <Loader2 className="h-4 w-4 animate-spin" /> : 'قبول'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">إلغاء الطلب</AlertDialogTitle>
            <AlertDialogDescription>هل تريد إلغاء هذا الطلب؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelRequest} disabled={submittingCancel} className="rounded-xl bg-red-600 hover:bg-red-700">
              {submittingCancel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showOfferConfirmDialog} onOpenChange={setShowOfferConfirmDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">تأكيد العرض</AlertDialogTitle>
            <AlertDialogDescription>هل تريد تقديم عرضك بسعر {offerPrice} للوحدة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitOffer} disabled={submittingOffer} className="rounded-xl bg-orange-500 hover:bg-orange-600">
              {submittingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={36} className="text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">تم إنشاء الطلب</h3>
            <p className="text-sm text-gray-500">في انتظار تأكيد الطرف الآخر خلال 30 دقيقة</p>
            <button onClick={() => navigate('/orders')} className="w-full h-12 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700">
              الذهاب للطلبات
            </button>
          </div>
        </div>
      )}
      <SubscriptionContactDialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen} />
      <PendingReviewDialog open={pendingReviewDialogOpen} onOpenChange={setPendingReviewDialogOpen} />

      <RegisterPromptDialog
        open={showRegisterPrompt}
        onOpenChange={setShowRegisterPrompt}
        action="تقديم عرض توريد"
      />
    </div>
  );
}
