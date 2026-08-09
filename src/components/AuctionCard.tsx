import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Package, Archive } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import { categoryIcon } from "@/lib/categoryIcon";

interface SellAuctionCardProps {
  type: "sell";
  public_id: string;
  title: string;
  image_url: string | null;
  interest_name?: string;
  unit_price: number;
  quantity: number;
  unit: string;
  bid_count: number;
  region_name: string;
  end_time: string;
}

interface BuyRequestCardProps {
  type: "buy";
  public_id: string;
  title: string;
  image_url: string | null;
  interest_name?: string;
  quantity: number;
  unit: string;
  offer_count: number;
  region_name: string;
  end_time: string;
}

const statusColor: Record<string, string> = {
  active: "text-green-600 bg-green-50 border-green-200",
  pending_selection: "text-yellow-700 bg-yellow-50 border-yellow-200",
  completed: "text-blue-600 bg-blue-50 border-blue-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
  expired: "text-gray-500 bg-gray-100 border-gray-200",
};

const statusText: Record<string, string> = {
  active: "نشط",
  pending_selection: "بانتظار الاختيار",
  completed: "مكتمل",
  cancelled: "ملغي",
  expired: "منتهي",
};

type AuctionCardProps = SellAuctionCardProps | BuyRequestCardProps;

export function AuctionCard(props: AuctionCardProps) {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const endTime = new Date(props.end_time).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft("منتهي");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        setTimeLeft(`${Math.floor(hours / 24)} يوم`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}س ${minutes}د`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}د ${seconds}ث`);
      } else {
        setTimeLeft(`${seconds}ث`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [props.end_time]);

  const handleClick = () => {
    if (props.type === "sell") navigate(`/auctions/sell/${props.public_id}`);
    else navigate(`/auctions/buy/${props.public_id}`);
  };

  const isExpired = timeLeft === "منتهي";
  const isSell = props.type === "sell";

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* 2.1 — Horizontal: image left 35%, content right 65% */}
      <div className="flex h-28">
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
              <span className="text-3xl" role="img" aria-label={props.interest_name || "منتج"}>
                {categoryIcon(props.interest_name)}
              </span>
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
            <h3 className="font-bold text-gray-900 text-xs line-clamp-1 mb-1">
              {props.title}
            </h3>
            <span className="text-[12px] text-gray-500 font-medium">
              {props.region_name}
            </span>
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
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                  statusColor[props.type === "sell" ? "active" : "expired"] ||
                  "text-gray-500 bg-gray-100 border-gray-200"
                }`}
              >
                {statusText[props.type === "sell" ? "active" : "expired"] ||
                  (props.type === "sell" ? "active" : "expired")}
              </span>
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
