import { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuthStore, isRetailer, isCarrier } from "@/stores/auth";
import { AuctionCard } from "@/components/AuctionCard";
import { Loader2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useWhatsAppUrl } from "@/lib/support";
import { trackPixel } from "@/lib/pixel";

interface Interest {
  id: number;
  name_ar: string;
  is_active: boolean;
}

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
}

export function AuctionsPage() {
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const whatsappUrl = useWhatsAppUrl();
  // A retailer buys from wholesalers and cannot fulfil a buy request, so the
  // tab is hidden and the feed stays on sell posts. The API enforces the same.
  const retailer = isRetailer(user);
  const carrier = isCarrier(user);
  const [activeTab, setActiveTab] = useState<"sell" | "buy">("sell");

  const [, setInterests] = useState<Interest[]>([]);
  const [selectedInterest] = useState<string>("all");

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

  const [searchParams, setSearchParams] = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(
    searchParams.get("welcome") === "true"
  );

  useEffect(() => {
    if (!isInitialized) return;
    const fetchInterests = async () => {
      try {
        const data = await api.get<{ interests: Interest[] }>("/interests");
        setInterests(data.interests || []);
      } catch (err) {
        console.error("Failed to fetch interests:", err);
      }
    };
    fetchInterests();
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    const fetchSellAuctions = async (page = 1, append = false) => {
      try {
        if (!append) setSellLoading(true);
        else setSellLoadingMore(true);
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: "20",
        });
        if (selectedInterest !== "all")
          params.append("interest_id", selectedInterest);
        const data = await api.get<{ auctions: SellAuction[]; total: number }>(
          `/sell-auctions?${params}`
        );
        setSellAuctions((prev) =>
          append ? [...prev, ...(data.auctions || [])] : data.auctions || []
        );
        setSellTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch sell auctions:", err);
      } finally {
        setSellLoading(false);
        setSellLoadingMore(false);
      }
    };
    fetchSellAuctions(sellPage);
  }, [isInitialized, selectedInterest, sellPage]);

  useEffect(() => {
    if (!isInitialized) return;
    const fetchBuyRequests = async (page = 1, append = false) => {
      try {
        if (!append) setBuyLoading(true);
        else setBuyLoadingMore(true);
        const params = new URLSearchParams({
          page: page.toString(),
          page_size: "20",
        });
        if (selectedInterest !== "all")
          params.append("interest_id", selectedInterest);
        const data = await api.get<{ requests: BuyRequest[]; total: number }>(
          `/buy-requests?${params}`
        );
        setBuyRequests((prev) =>
          append ? [...prev, ...(data.requests || [])] : data.requests || []
        );
        setBuyTotal(data.total || 0);
      } catch (err) {
        console.error("Failed to fetch buy requests:", err);
      } finally {
        setBuyLoading(false);
        setBuyLoadingMore(false);
      }
    };
    fetchBuyRequests(buyPage);
  }, [isInitialized, selectedInterest, buyPage]);

  useEffect(() => {
    if (!showWelcome && searchParams.get("welcome") === "true") {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("welcome");
      setSearchParams(newParams);
    }
  }, [showWelcome, searchParams, setSearchParams]);

  const handleLoadMore = (type: "sell" | "buy") => {
    if (type === "sell") setSellPage((prev) => prev + 1);
    else setBuyPage((prev) => prev + 1);
  };

  // The feed is public (#4), so ProtectedRoute never sees it — a signed-in
  // carrier landing here has followed a link or a stale tab, and it cannot bid
  // on anything it would see.
  if (carrier) return <Navigate to="/carrier/jobs" replace />;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="px-4 pt-4 space-y-4">
        {!isInitialized && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        )}

        {user?.status === "pending_review" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
            <div className="text-sm text-yellow-800 font-bold">
              حسابك قيد المراجعة
            </div>
          </div>
        )}

        {/* 6.3 — Sell/buy tab toggle */}
        {!retailer && (
        <div className="flex p-1 bg-white rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveTab("sell")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "sell"
                ? "bg-green-600 text-white shadow-sm"
                : "text-gray-500"
            }`}
          >
            معروض البيع
          </button>
          <button
            onClick={() => setActiveTab("buy")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === "buy"
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-500"
            }`}
          >
           مطلوب للشراء
          </button>
        </div>
        )}

        {/* Sell Tab */}
        {activeTab === "sell" && (
          <div className="space-y-3">
            {sellLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : sellAuctions.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-bold">
                لا توجد عروض بيع
              </div>
            ) : (
              <div className="space-y-3">
                {sellAuctions.map((auction) => (
                  <AuctionCard
                    key={auction.public_id}
                    {...auction}
                    type="sell"
                  />
                ))}
              </div>
            )}
            {!sellLoading &&
              !sellLoadingMore &&
              sellAuctions.length < sellTotal && (
                // 6.4 — Load more button
                <button
                  onClick={() => handleLoadMore("sell")}
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

        {/* Buy Tab */}
        {activeTab === "buy" && !retailer && (
          <div className="space-y-3">
            {buyLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
              </div>
            ) : buyRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-400 font-bold">
                لا توجد طلبات شراء
              </div>
            ) : (
              <div className="space-y-3">
                {buyRequests.map((request) => (
                  <AuctionCard
                    key={request.public_id}
                    {...request}
                    type="buy"
                  />
                ))}
              </div>
            )}
            {!buyLoading &&
              !buyLoadingMore &&
              buyRequests.length < buyTotal && (
                <button
                  onClick={() => handleLoadMore("buy")}
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

      {/* 6.5 — Welcome dialog */}
      {showWelcome && (
        <div className="fixed  inset-0 bg-black/50 z-50 flex items-center sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-b from-green-700 to-green-500 px-6 pt-8 pb-6 text-center">
              <h2 className="text-2xl font-extrabold text-white mb-1">
                مرحباً بك في ربحانة 🎉
              </h2>
              <p className="text-green-100 text-sm">
                يمكنك الآن تصفح الصفقات والطلبات
              </p>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-gray-600 text-sm text-center">
                للبدء في تقديم العروض أو إنشاء صفقة، تواصل معنا للاشتراك
              </p>
              <button
                onClick={() => setShowWelcome(false)}
                className="w-full h-12 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-colors"
              >
                متابعة
              </button>
              <button
                onClick={() => {
                  trackPixel("Lead", { source: "auctions_banner" });
                  window.open(whatsappUrl, "_blank");
                }}
                className="w-full h-12 border-2 border-green-600 text-green-600 rounded-2xl font-bold hover:bg-green-50 transition-colors"
              >
                تواصل معنا
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
