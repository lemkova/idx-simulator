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
    <div className="flex items-center justify-center gap-4 px-3 py-1.5 bg-slate-800 border-y border-slate-600">
      <span className="text-xs text-slate-400">
        Mid:{" "}
        <span className="text-slate-200 font-mono">
          {formatPrice(midPrice)}
        </span>
      </span>
      <span className="text-xs text-slate-400">
        Spread:{" "}
        <span className="text-amber-400 font-mono">{formatPrice(spread)}</span>
      </span>
      <span className="text-xs text-slate-500">
        ({spreadPct}%)
      </span>
    </div>
  );
});
