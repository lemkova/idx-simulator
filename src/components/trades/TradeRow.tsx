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
  const colorClass = side === "buy" ? "text-green-400" : "text-red-400";

  return (
    <div className="flex items-center h-5 text-[11px] hover:bg-slate-700/50 px-2 border-b border-slate-700/30">
      <span className="w-16 text-slate-500 font-mono">{timeStr}</span>
      <span className={`w-20 text-right font-mono ${colorClass}`}>
        {formatPrice(price)}
      </span>
      <span className="w-16 text-right text-slate-400 font-mono">
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
