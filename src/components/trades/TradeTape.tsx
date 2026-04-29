"use client";
import { useEffect, useRef, useState } from "react";
import { ListDashes } from "@phosphor-icons/react";
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
    <div className="panel flex-1 bg-term-panel border border-term-border rounded-lg flex flex-col overflow-hidden min-h-0">
      <div className="h-10 shrink-0 border-b border-term-border flex items-center justify-between px-3 bg-white/[0.01]">
        <div className="flex items-center gap-2">
          <ListDashes size={14} weight="fill" className="text-slate-400" />
          <h2 className="text-xs font-semibold text-white tracking-wide uppercase">
            Time & Sales
          </h2>
        </div>
        <div className="h-2 w-2 rounded-full bg-buy animate-pulse" />
      </div>

      <div className="grid grid-cols-[72px_1fr_72px] px-3 py-1.5 border-b border-term-border text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-term-base/50">
        <span>Time</span>
        <span className="text-right pr-4">Price</span>
        <span className="text-right">Lots</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar relative">
        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-term-panel to-transparent z-10 pointer-events-none" />
        {trades.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-slate-600 text-xs">No trades yet</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {trades.map((trade) => (
              <TradeRow
                key={trade.id}
                time={trade.simTimestamp}
                price={trade.price}
                volume={trade.quantity}
                side={trade.side}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
