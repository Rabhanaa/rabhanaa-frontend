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

interface SellAuction {
  public_id: string; region_name: string; interest_name: string; title: string;
  description: string | null; image_url: string | null; unit: string; quantity: number;
  unit_price: number; buy_all_from_one: boolean; bid_count: number; end_time: string;
  status: string; is_owner: boolean; is_expired: boolean; created_at: string;
}

interface Bid {
  public_id: string; bidder_name: string; bidder_region: string; amount: number;
  is_selected: boolean; is_my_bid: boolean; created_at: string;
}

export function SellAuctionDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const user = useAuthStore((state) => state.user);
  const [auction, setAuction] = useState<SellAuction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [submittingSelect, setSubmittingSelect] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [showSelectDialog, setShowSelectDialog] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showBidConfirmDialog, setShowBidConfirmDialog] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [pendingReviewDialogOpen, setPendingReviewDialogOpen] = useState(false);

  useEffect(() => {
    api.get<SellAuction>(`/sell-auctions/${publicId}`)
      .then(setAuction).catch((err) => handleError(err)).finally(() => setLoading(false));
  }, [publicId]);

  useEffect(() => {
    if (!auction?.is_owner) return;
    api.get<{ bids: Bid[] }>(`/sell-auctions/${publicId}/bids`)
      .then((d) => setBids(d.bids || [])).catch(console.error);
  }, [publicId, auction?.is_owner]);

  useEffect(() => {
    if (!auction?.end_time) return;
    const updateTime = () => {
      const diff = new Date(auction.end_time).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('منتهي'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 24) setTimeLeft(`${Math.floor(h / 24)} يوم`);
      else if (h > 0) setTimeLeft(`${h}س ${m}د`);
      else if (m > 0) setTimeLeft(`${m}د ${s}ث`);
      else setTimeLeft(`${s}ث`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [auction?.end_time]);


  const handleSelectBid = async (bidId: string) => {
    setSubmittingSelect(true);
    try { await api.post(`/sell-auctions/${publicId}/select`, { bid_public_id: bidId }); setShowSelectDialog(null); setShowSuccessPopup(true); }
    catch (err) { handleError(err); }
    finally { setSubmittingSelect(false); }
  };

  const handleCancelAuction = async () => {
    setSubmittingCancel(true);
    try { await api.post(`/sell-auctions/${publicId}/cancel`, {}); setShowCancelDialog(false); navigate('/my-auctions'); }
    catch (err) { handleError(err); }
    finally { setSubmittingCancel(false); }
  };

  const handleSubmitBid = async () => {
    if (user?.status === 'pending_review' || user?.status === 'inactive') {
      setShowBidConfirmDialog(false);
      setPendingReviewDialogOpen(true);
      return;
    }
    setSubmittingBid(true);
    try {
      await api.post(`/sell-auctions/${publicId}/bids`, { amount: parseFloat(bidAmount) });
      setShowBidConfirmDialog(false);
      navigate('/my-bids');
    } catch (err) {
      if (isSubscriptionError(err)) {
        setShowBidConfirmDialog(false);
        setSubscriptionDialogOpen(true);
      } else if (isPendingReviewError(err)) {
        setShowBidConfirmDialog(false);
        setPendingReviewDialogOpen(true);
      } else {
        handleError(err);
      }
    } finally {
      setSubmittingBid(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-600" /></div>;
  if (!auction) return null;

  const statusText: Record<string, string> = { active: 'نشط', pending_selection: 'بانتظار الاختيار', completed: 'مكتمل', cancelled: 'ملغي', expired: 'منتهي' };
  const isExpired = timeLeft === 'منتهي';

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* 8.1 Hero image */}
      <div className="relative h-72">
        {auction.image_url
          ? <img src={getImageUrl(auction.image_url) || undefined} alt={auction.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          : <div className="w-full h-full bg-gray-200 flex items-center justify-center"><Package size={64} className="text-gray-400" /></div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-10 end-4 bg-white/80 p-2 rounded-full backdrop-blur-md shadow-md">
          <ChevronRight size={24} className="text-gray-800" />
        </button>
        <span className={`absolute top-10 start-4 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md ${auction.status === 'active' ? 'bg-green-600 text-white' : 'bg-white/80 text-gray-800'}`}>
          {statusText[auction.status] || auction.status}
        </span>
      </div>

      {/* 8.2 Detail card */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-3xl p-5 shadow-lg space-y-4">
          <h1 className="text-xl font-bold text-gray-900">{auction.title}</h1>
          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl"><Tag size={12} />{auction.interest_name}</span>
            <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1.5 rounded-xl"><MapPin size={12} />{auction.region_name}</span>
            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-100"><Package size={12} />{auction.quantity} {auction.unit}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 font-bold mb-0.5">السعر للوحدة</p>
              <p className="text-2xl font-extrabold text-green-600">{auction.unit_price} <span className="text-sm text-gray-400 font-bold">/{auction.unit}</span></p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-bold ${isExpired ? 'bg-red-50 border-red-200 text-red-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
              <Clock size={14} />{timeLeft}
            </div>
          </div>
          {auction.description && <p className="text-gray-500 text-sm leading-relaxed">{auction.description}</p>}
          {/* 8.4 Owner bids list */}
          {auction.is_owner && (
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Gavel size={16} className="text-green-600" />العروض
                  <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">{bids.length}</span>
                </h2>
                {auction.status === 'active' && auction.bid_count === 0 && (
                  <button onClick={() => setShowCancelDialog(true)} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">إلغاء الصفقة</button>
                )}
              </div>
              {bids.length === 0
                ? <div className="text-center py-8 text-gray-400 font-bold">لا توجد عروض بعد</div>
                : <div className="space-y-3">
                    {bids.map((bid) => (
                      <div key={bid.public_id} className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{bid.bidder_name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{bid.bidder_region}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(bid.created_at).toLocaleString('ar-EG')}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-lg font-extrabold text-green-600">{bid.amount}</span>
                          {bid.is_selected && <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} />تم الاختيار</span>}
                          {!bid.is_selected && (auction.status === 'active' || auction.status === 'pending_selection') && (
                            <button onClick={() => setShowSelectDialog(bid.public_id)} className="text-xs font-bold text-white bg-green-600 px-4 py-1.5 rounded-xl hover:bg-green-700">اختيار</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          )}

          {/* 8.3 Bidder submit */}
          {!auction.is_owner && (
            <div className="pt-2 border-t border-gray-100">
              {auction.is_expired ? (
                <div className="text-center py-6 text-gray-400 font-bold">الصفقة منتهية</div>
              ) : (
                <div className="space-y-3">
                  <h2 className="font-bold text-gray-900">تقديم عرض</h2>
                  <div className="flex gap-2">
                    <input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)}
                      className="flex-1 h-14 border border-gray-200 rounded-xl px-4 font-bold text-lg outline-none focus:border-green-500 bg-white"
                      placeholder="المبلغ المقترح" />
                    <button onClick={() => setShowBidConfirmDialog(true)} disabled={!bidAmount || submittingBid}
                      className="h-14 px-5 bg-green-600 text-white rounded-xl font-bold shadow-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 8.6 Dialogs */}
      <AlertDialog open={showSelectDialog !== null} onOpenChange={() => setShowSelectDialog(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">اختيار العرض</AlertDialogTitle>
            <AlertDialogDescription>هل تريد اختيار هذا العرض؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => showSelectDialog && handleSelectBid(showSelectDialog)} disabled={submittingSelect} className="rounded-xl bg-green-600 hover:bg-green-700">
              {submittingSelect ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">إلغاء الصفقة</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من إلغاء هذه الصفقة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelAuction} disabled={submittingCancel} className="rounded-xl bg-red-600 hover:bg-red-700">
              {submittingCancel ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد الإلغاء'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBidConfirmDialog} onOpenChange={setShowBidConfirmDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-bold">تقديم العرض</AlertDialogTitle>
            <AlertDialogDescription>هل تريد تقديم عرضك بمبلغ {bidAmount}؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitBid} disabled={submittingBid} className="rounded-xl bg-green-600 hover:bg-green-700">
              {submittingBid ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تأكيد'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 8.7 Success popup */}
      <AlertDialog open={showSuccessPopup} onOpenChange={(open) => { if (!open) navigate('/orders'); }}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={36} className="text-green-600" />
              </div>
              <AlertDialogTitle className="font-bold text-center">تم إنشاء الطلب</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-center">في انتظار تأكيد الطرف الآخر خلال 30 دقيقة</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => navigate('/orders')} className="rounded-xl bg-green-600 hover:bg-green-700 w-full">الذهاب للطلبات</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <SubscriptionContactDialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen} />
      <PendingReviewDialog open={pendingReviewDialogOpen} onOpenChange={setPendingReviewDialogOpen} />
    </div>
  );
}
