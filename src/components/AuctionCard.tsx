import { useNavigate } from "react-router-dom";
import { useCountdown } from "@/hooks/useCountdown";
import { Clock, Package, Archive } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import { POST_STATUS_TEXT } from "@/lib/postStatus";

// status and moderation_reason are only sent by the my-posts endpoint — the
// public feed lists active posts only and omits both. Undefined therefore means
// "no chip", which is deliberate: the card used to hardcode the chip to نشط for
// every sell post and منتهي for every buy request, so a rejected post read as
// active and every buy request in the feed read as expired.
interface SellAuctionCardProps {
  type: "sell";
  public_id: string;
  title: string;
  image_url: string | null;
  unit_price: number;
  quantity: number;
  unit: string;
  bid_count: number;
  region_name: string;
  end_time: string;
  status?: string;
  moderation_reason?: string | null;
}

interface BuyRequestCardProps {
  type: "buy";
  public_id: string;
  title: string;
  image_url: string | null;
  quantity: number;
  unit: string;
  offer_count: number;
  region_name: string;
  end_time: string;
  status?: string;
  moderation_reason?: string | null;
}

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

const statusText = POST_STATUS_TEXT;

type AuctionCardProps = SellAuctionCardProps | BuyRequestCardProps;

export function AuctionCard(props: AuctionCardProps) {
  const navigate = useNavigate();
  // No seconds on a card: the label then changes once a minute, so the other 59
  // ticks are a no-op re-render for every card in the feed. See lib/countdown.ts.
  const { timeLeft, isExpired } = useCountdown(props.end_time);

  const handleClick = () => {
    if (props.type === "sell") navigate(`/auctions/sell/${props.public_id}`);
    else navigate(`/auctions/buy/${props.public_id}`);
  };

  const isSell = props.type === "sell";

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* 2.1 — Horizontal: image left 35%, content right 65%.
          min-h rather than a fixed height: a refused post carries an extra
          line of reason text, and a fixed 7rem clipped the bottom row off. */}
      <div className="flex min-h-28">
        {/* Image */}
        <div className="relative w-[35%] shrink-0 bg-gray-100">
          {props.image_url ? (
            <img
              src={getImageUrl(props.image_url) || undefined}
              alt={props.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-3xl">📦</span>
            </div>
          )}

          {/* 2.2 — Mode badge top-right of image */}
          <span
            className={`absolute top-1.5 start-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md text-white ${
              isSell ? "bg-green-600" : "bg-orange-500"
            }`}
          >
            {isSell ? "معروض" : "مطلوب"}
          </span>

          {/* 2.3 — Expired overlay */}
          {isExpired && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
              <Archive size={20} className="text-white" />
              <span className="text-white text-[9px] font-bold">منتهي</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-2.5 flex flex-col justify-between overflow-hidden">
          <div>
            {/* Title start, status end — the status of a post is the first
                thing its owner looks for, so it sits on the top line rather
                than competing with the countdown at the bottom. */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-bold text-gray-900 text-xs line-clamp-1">
                {props.title}
              </h3>
              {props.status && (
                <span
                  className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    statusColor[props.status] ||
                    "text-gray-500 bg-gray-100 border-gray-200"
                  }`}
                >
                  {statusText[props.status] || props.status}
                </span>
              )}
            </div>
            <span className="text-[12px] text-gray-500 font-medium">
              {props.region_name}
            </span>
            {/* Why a post was refused or taken down, in the card itself — the
                owner should not have to open it to find out. */}
            {props.moderation_reason && (
              <p className="mt-0.5 text-[10px] font-medium text-red-600 line-clamp-1">
                {props.moderation_reason}
              </p>
            )}
          </div>

          {/* 2.4 — Price */}
          {isSell && (
            <div className="text-sm font-extrabold text-green-600">
              <span className="text-[12px] text-gray-500 font-medium">
                سعر الوحدة :
              </span>
              {(props as SellAuctionCardProps).unit_price}{" "}
              <span className="text-[12px] font-bold text-gray-400">
                /{props.unit}
              </span>
            </div>
          )}

          {/* 2.6 — Quantity/unit badge */}
          <div className="flex items-center justify-between mt-1">
            <span className="flex items-center gap-0.5 bg-gray-100 text-gray-600 text-[12px] font-bold px-1.5 py-0.5 rounded-md">
              <Package size={9} />
              {props.quantity} {props.unit}
            </span>

            <div className="flex justify-end px-1 gap-2">
              <span
                className={`flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                  isExpired
                    ? "border-red-200 bg-red-50 text-red-600"
                    : "border-blue-200 bg-blue-50 text-blue-600"
                }`}
              >
                <Clock size={9} />
                {timeLeft}
              </span>
            </div>

            {/* 2.5 — Timer pill bottom-right */}
          </div>
        </div>
      </div>
    </div>
  );
}
