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
  if (price === 0) {
    return (
      <div className="relative flex items-center h-6 text-[11px]">
        <span className="w-full pl-3 text-slate-600">--</span>
        <span className="w-16 text-right text-slate-600 pr-4">--</span>
        <span className="w-12 text-right text-slate-600 pr-1">--</span>
      </div>
    );
  }

  const widthPct = maxVolume > 0 ? Math.min(100, (volume / maxVolume) * 100) : 0;
  const isAsk = side === "ask";
  const textColor = isAsk ? "text-sell" : "text-buy";
  const bgClass = isAsk ? "bg-sell-dim" : "bg-buy-dim";

  return (
    <div className="relative flex items-center justify-between pl-3 pr-1 h-6 text-[11px] cursor-pointer data-row group">
      <div
        className={`absolute inset-y-0 right-0 ${bgClass}`}
        style={{ width: `${widthPct}%` }}
      />
      <span className={`z-10 font-bold ${textColor}`}>
        {formatPrice(price)}
      </span>
      <span className="z-10 text-right text-slate-300 w-16 pr-4">
        {formatVolume(volume)}
      </span>
      <span className="z-10 text-right text-slate-500 w-12 group-hover:text-white transition-colors">
        {orderCount}
      </span>
    </div>
  );
});
