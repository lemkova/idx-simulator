"use client";
import { memo } from "react";
import { formatPrice, formatVolume } from "../../lib/format";

interface OrderBookRowProps {
  price: number;
  volume: number;
  orderCount: number;
  maxVolume: number;
  side: "bid" | "ask";
}

export const OrderBookRow = memo(function OrderBookRow({
  price,
  volume,
  orderCount,
  maxVolume,
  side,
}: OrderBookRowProps) {
  // Placeholder row — render empty to maintain visual spacing
  if (price === 0) {
    return (
      <div className="relative h-6 flex items-center text-xs border-b border-slate-700/50">
        <span className="w-24 pl-2 text-slate-600">--</span>
        <span className="w-20 text-right text-slate-600">--</span>
        <span className="w-12 text-right text-slate-600">--</span>
      </div>
    );
  }

  const widthPct = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;
  const barColor =
    side === "bid" ? "bg-green-500/20" : "bg-red-500/20";
  const textColor =
    side === "bid" ? "text-green-400" : "text-red-400";

  return (
    <div className="relative h-6 flex items-center text-xs border-b border-slate-700/50">
      <div
        className={`absolute inset-y-0 ${
          side === "bid" ? "right-0" : "left-0"
        } ${barColor}`}
        style={{ width: `${widthPct}%` }}
      />
      <span className={`relative z-10 w-24 pl-2 font-mono ${textColor}`}>
        {formatPrice(price)}
      </span>
      <span className="relative z-10 w-20 text-right text-slate-300 font-mono">
        {formatVolume(volume)}
      </span>
      <span className="relative z-10 w-12 text-right text-slate-500">
        {orderCount}
      </span>
    </div>
  );
});
