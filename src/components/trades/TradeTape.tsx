"use client";
import { useEffect, useRef } from "react";
import { useTradeTape } from "../../hooks/useSimulation";
import { TradeRow } from "./TradeRow";

export function TradeTape() {
  const trades = useTradeTape();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [trades]);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col h-[300px]">
      <div className="px-3 py-2 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">
          Trade Tape
        </span>
      </div>
      <div className="px-2 py-1 border-b border-slate-700 flex text-[10px] text-slate-500">
        <span className="w-16">Time</span>
        <span className="w-20 text-right">Price</span>
        <span className="w-16 text-right">Lots</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-slate-600 text-xs">No trades yet</span>
          </div>
        ) : (
          trades.map((trade) => (
            <TradeRow
              key={trade.id}
              time={trade.simTimestamp}
              price={trade.price}
              volume={trade.quantity}
              side={trade.side}
            />
          ))
        )}
      </div>
    </div>
  );
}
