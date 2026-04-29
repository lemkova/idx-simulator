"use client";
import { BookOpen } from "@phosphor-icons/react";
import { useOrderBook, useSelectedStockId, useStockList } from "../../hooks/useSimulation";
import { AskLadder } from "./AskLadder";
import { BidLadder } from "./BidLadder";
import { SpreadIndicator } from "./SpreadIndicator";

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

  const allLevels = [...snapshot.asks, ...snapshot.bids];
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

      <div className="flex-1 grid grid-rows-[1fr_auto_1fr] overflow-hidden text-[11px] font-mono leading-none min-h-0">
        <div className="overflow-y-auto no-scrollbar min-h-0">
          <AskLadder levels={snapshot.asks} maxVolume={maxVol} />
        </div>
        <SpreadIndicator spread={snapshot.spread} midPrice={snapshot.midPrice} />
        <div className="overflow-y-auto no-scrollbar min-h-0">
          <BidLadder levels={snapshot.bids} maxVolume={maxVol} />
        </div>
      </div>
    </div>
  );
}
