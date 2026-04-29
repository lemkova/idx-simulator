"use client";
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
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-4 flex items-center justify-center h-[400px]">
        <span className="text-slate-500 text-sm">
          Press Start to begin simulation
        </span>
      </div>
    );
  }

  // Pad levels to exactly DEPTH rows for visual stability
  const paddedAsks = padLevels(snapshot.asks, DEPTH);
  const paddedBids = padLevels(snapshot.bids, DEPTH);

  const allLevels = [...paddedAsks, ...paddedBids];
  const maxVol = Math.max(...allLevels.map((l) => l.totalQuantity), 1);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">
          Order Book — {stock?.name ?? selectedId}
        </span>
        <span className="text-[10px] text-slate-500">Lot: 500 shares</span>
      </div>
      <div className="flex flex-col">
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
