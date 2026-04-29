"use client";
import { BookOpen } from "@phosphor-icons/react";
import { useOrderBook, useSelectedStockId, useStockList } from "../../hooks/useSimulation";
import { AskLadder } from "./AskLadder";
import { BidLadder } from "./BidLadder";
import { SpreadIndicator } from "./SpreadIndicator";

const DEPTH = 7;

export function OrderBook() {
  const snapshot = useOrderBook();
  const selectedId = useSelectedStockId();
  const stocks = useStockList();
  const stock = stocks.find((s) => s.stockId === selectedId);

  if (!snapshot) {
    return (
      <div className="panel bg-term-panel border border-term-border rounded-lg flex items-center justify-center h-full">
        <span className="text-slate-500 text-sm">Press Start to begin</span>
      </div>
    );
  }

  const paddedAsks = padLevels(snapshot.asks, DEPTH);
  const paddedBids = padLevels(snapshot.bids, DEPTH);

  const allLevels = [...paddedAsks, ...paddedBids];
  const maxVol = Math.max(...allLevels.map((l) => l.totalQuantity), 1);

  return (
    <div className="panel bg-term-panel border border-term-border rounded-lg flex flex-col overflow-hidden h-full">
      <div className="h-10 shrink-0 border-b border-term-border flex items-center justify-between px-3 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <BookOpen size={14} weight="fill" className="text-slate-400" />
          <h2 className="text-xs font-semibold text-white tracking-wide uppercase">
            Order Book
          </h2>
        </div>
        <span className="text-[10px] text-slate-500">
          {stock?.name ?? selectedId} · Lot 500
        </span>
      </div>

      <div className="grid grid-cols-[1fr_1fr_56px] px-3 py-1.5 border-b border-term-border text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-term-base/50">
        <span>Price (IDR)</span>
        <span className="text-right">Volume</span>
        <span className="text-right">#</span>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative text-[11px] font-mono leading-none">
        <AskLadder levels={paddedAsks} maxVolume={maxVol} />
        <SpreadIndicator spread={snapshot.spread} midPrice={snapshot.midPrice} />
        <BidLadder levels={paddedBids} maxVolume={maxVol} />
      </div>
    </div>
  );
}

function padLevels(
  levels: { price: number; totalQuantity: number; orderCount: number }[],
  target: number
) {
  const padded = [...levels];
  while (padded.length < target) {
    padded.push({ price: 0, totalQuantity: 0, orderCount: 0 });
  }
  return padded.slice(0, target);
}
