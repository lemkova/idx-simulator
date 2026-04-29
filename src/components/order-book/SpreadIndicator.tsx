"use client";
import { memo } from "react";
import { formatPrice } from "../../lib/format";

interface SpreadIndicatorProps {
  spread: number;
  midPrice: number;
}

export const SpreadIndicator = memo(function SpreadIndicator({
  spread,
  midPrice,
}: SpreadIndicatorProps) {
  const spreadPct =
    midPrice > 0 ? ((spread / midPrice) * 100).toFixed(2) : "0";

  return (
    <div className="shrink-0 h-10 border-y border-term-border bg-term-base/80 flex items-center justify-between px-4">
      <div className="flex flex-col">
        <span className="text-xs font-sans text-slate-400">Mid Price</span>
        <span className="text-white text-sm font-bold tracking-tight">
          {formatPrice(midPrice)}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-xs font-sans text-slate-400">Spread</span>
        <span className="text-accent text-xs">
          {formatPrice(spread)}{" "}
          <span className="text-[10px] text-slate-500">({spreadPct}%)</span>
        </span>
      </div>
    </div>
  );
});
