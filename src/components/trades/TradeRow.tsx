"use client";
import { memo } from "react";
import { formatPrice, formatVolume } from "../../lib/format";

interface TradeRowProps {
  time: number;
  price: number;
  volume: number;
  side: "buy" | "sell";
}

export const TradeRow = memo(function TradeRow({
  time,
  price,
  volume,
  side,
}: TradeRowProps) {
  const timeStr = formatSimTime(time);
  const isBuy = side === "buy";
  const colorClass = isBuy ? "text-buy" : "text-sell";

  return (
    <div
      className={`grid grid-cols-[72px_1fr_72px] px-3 py-0.5 h-5 text-[11px] font-mono border-b border-term-border/30 data-row cursor-pointer animate-slide-in-right ${
        isBuy ? "animate-flash-up" : "animate-flash-down"
      }`}
    >
      <span className="text-slate-500">{timeStr}</span>
      <span className={`text-right font-bold pr-4 ${colorClass}`}>
        {formatPrice(price)}
      </span>
      <span className="text-right text-slate-400">
        {formatVolume(volume)}
      </span>
    </div>
  );
});

function formatSimTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
