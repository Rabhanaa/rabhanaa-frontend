import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuctionCard } from "@/components/AuctionCard";
import { Loader2, List } from "lucide-react";
import { api } from "@/lib/api";
import { useApiError } from "@/hooks/useApiError";

interface SellAuction {
  public_id: string;
  title: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  unit: string;
  bid_count: number;
  region_name: string;
  end_time: string;
  status: string;
  moderation_reason?: string;
}

interface BuyRequest {
  public_id: string;
  title: string;
  image_url: string | null;
  quantity: number;
  unit: string;
  offer_count: number;
  region_name: string;
  end_time: string;
  status: string;
  moderation_reason?: string;
}

const statusText: Record<string, string> = {
  suspended: "موقوف",
  rejected: "مرفوض",
  pending_approval: "بانتظار الموافقة",
  active: "نشط",
  pending_selection: "بانتظار الاختيار",
  completed: "مكتمل",
  cancelled: "ملغي",
  expired: "منتهي",
};
const statusColor: Record<string, string> = {
  suspended: "text-orange-700 bg-orange-50 border-orange-200",
  rejected: "text-red-600 bg-red-50 border-red-200",
  pending_approval: "text-yellow-700 bg-yellow-50 border-yellow-200",
  active: "text-green-600 bg-green-50 border-green-200",
  pending_selection: "text-yellow-700 bg-yellow-50 border-yellow-200",
  completed: "text-blue-600 bg-blue-50 border-blue-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
  expired: "text-gray-500 bg-gray-100 border-gray-200",
};

export function MyAuctionsPage() {
  const navigate = useNavigate();
  const { handleError } = useApiError();
  const [activeTab, setActiveTab] = useState<"sell" | "buy">("sell");
  const [sellAuctions, setSellAuctions] = useState<SellAuction[]>([]);
  const [sellPage, setSellPage] = useState(1);
  const [sellTotal, setSellTotal] = useState(0);
  const [sellLoading, setSellLoading] = useState(true);
  const [sellLoadingMore, setSellLoadingMore] = useState(false);
  const [buyRequests, setBuyRequests] = useState<BuyRequest[]>([]);
  const [buyPage, setBuyPage] = useState(1);
  const [buyTotal, setBuyTotal] = useState(0);
  const [buyLoading, setBuyLoading] = useState(true);
  const [buyLoadingMore, setBuyLoadingMore] = useState(false);

  useEffect(() => {
    const fetch = async (page = 1, append = false) => {
      try {
        if (!append) setSellLoading(true);
        else setSellLoadingMore(true);
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: "20",
        });
        const data = await api.get<{ auctions: SellAuction[]; total: number }>(
          `/sell-auctions/mine?${params}`
        );
        setSellAuctions((prev) =>
          append ? [...prev, ...(data.auctions || [])] : data.auctions || []
        );
        setSellTotal(data.total || 0);
      } catch {
        handleError(new Error("فشل تحميل عروض البيع"));
      } finally {
        setSellLoading(false);
        setSellLoadingMore(false);
      }
    };
    fetch(sellPage);
  }, [sellPage]);

  useEffect(() => {
    const fetch = async (page = 1, append = false) => {
      try {
        if (!append) setBuyLoading(true);
        else setBuyLoadingMore(true);
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: "20",
        });
        const data = await api.get<{ requests: BuyRequest[]; total: number }>(
          `/buy-requests/mine?${params}`
        );
        setBuyRequests((prev) =>
          append ? [...prev, ...(data.requests || [])] : data.requests || []
        );
        setBuyTotal(data.total || 0);
      } catch {
        handleError(new Error("فشل تحميل طلبات الشراء"));
      } finally {
        setBuyLoading(false);
        setBuyLoadingMore(false);
      }
    };
    fetch(buyPage);
  }, [buyPage]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <div className="px-4 pt-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <List size={22} className="text-green-600" /> الخاصة بي
        </h1>
        {/* 10.2 — Tab pills */}
        <div className="flex p-1 bg-white rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab("sell")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "sell"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-500"
            }`}
          >
            عارض البيع
          </button>
          <button
            onClick={() => setActiveTab("buy")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "buy"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500"
            }`}
          >
            طالب للشراء
          </button>
        </div>

        {/* Sell tab */}
        {activeTab === "sell" && (
          <div className="space-y-3">
            {sellLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : sellAuctions.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <List size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-bold text-base">لا توجد صفقات بعد</p>
                <p className="text-gray-500 text-sm">أنشئ أول صفقة لك وابدأ بالبيع أو الشراء</p>
                <button
                  onClick={() => navigate('/create')}
                  className="w-full max-w-xs h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold mx-auto block transition-colors"
                >
                  أنشئ صفقتك الأولى
                </button>
              </div>
            ) : (
              sellAuctions.map((a) => (
                <div key={a.public_id} className="space-y-1.5">
                  <AuctionCard {...a} type="sell" />
                  {/* Sell posts had no status chip; sellers now need to see that
                      a post is awaiting review, and why one was refused. */}
                  <div className="flex flex-col items-end gap-1 px-1">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        statusColor[a.status] ||
                        "text-gray-500 bg-gray-100 border-gray-200"
                      }`}
                    >
                      {statusText[a.status] || a.status}
                    </span>
                    {a.moderation_reason && (
                      <p className="text-[10px] text-gray-500 text-end">{a.moderation_reason}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {!sellLoading &&
              !sellLoadingMore &&
              sellAuctions.length < sellTotal && (
                <button
                  onClick={() => setSellPage((p) => p + 1)}
                  className="w-full h-12 rounded-2xl border-2 border-green-600 text-green-600 font-bold text-sm hover:bg-green-50 transition-colors"
                >
                  تحميل المزيد
                </button>
              )}
            {sellLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            )}
          </div>
        )}

        {/* Buy tab */}
        {activeTab === "buy" && (
          <div className="space-y-3">
            {buyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : buyRequests.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <List size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-900 font-bold text-base">لا توجد صفقات بعد</p>
                <p className="text-gray-500 text-sm">أنشئ أول صفقة لك وابدأ بالبيع أو الشراء</p>
                <button
                  onClick={() => navigate('/create')}
                  className="w-full max-w-xs h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold mx-auto block transition-colors"
                >
                  أنشئ صفقتك الأولى
                </button>
              </div>
            ) : (
              buyRequests.map((r) => (
                <div key={r.public_id} className="space-y-1.5">
                  <AuctionCard {...r} type="buy" />
                  <div className="flex flex-col items-end gap-1 px-1">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        statusColor[r.status] ||
                        "text-gray-500 bg-gray-100 border-gray-200"
                      }`}
                    >
                      {statusText[r.status] || r.status}
                    </span>
                    {r.moderation_reason && (
                      <p className="text-[10px] text-gray-500 text-end">{r.moderation_reason}</p>
                    )}
                  </div>
                </div>
              ))
            )}
            {!buyLoading &&
              !buyLoadingMore &&
              buyRequests.length < buyTotal && (
                <button
                  onClick={() => setBuyPage((p) => p + 1)}
                  className="w-full h-12 rounded-2xl border-2 border-green-600 text-green-600 font-bold text-sm hover:bg-green-50 transition-colors"
                >
                  تحميل المزيد
                </button>
              )}
            {buyLoadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-green-600" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
