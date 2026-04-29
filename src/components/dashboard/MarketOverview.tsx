"use client";
import {
  CaretUp,
  CaretDown,
  Minus,
} from "@phosphor-icons/react";
import {
  useStockSummaries,
  useStockList,
  useSelectedStockId,
} from "../../hooks/useSimulation";
import { formatPrice, formatPercent, formatVolume } from "../../lib/format";
import { simStore } from "../../stores/simulation-store";

export function MarketOverview() {
  const stockConfigs = useStockList();
  const summaries = useStockSummaries();
  const selectedId = useSelectedStockId();

  return (
    <div className="panel h-[180px] shrink-0 bg-term-panel border border-term-border rounded-lg flex flex-col overflow-hidden">
      <div className="grid grid-cols-[80px_1fr_1fr_1fr_1fr_1.5fr] px-4 py-2 border-b border-term-border text-[10px] text-slate-500 font-medium uppercase tracking-wider bg-term-base/50">
        <span>Ticker</span>
        <span className="text-right">Last</span>
        <span className="text-right">Chg%</span>
        <span className="text-right">High</span>
        <span className="text-right">Low</span>
        <span className="text-right">Vol (Lots)</span>
      </div>
      <div className="flex-1 overflow-y-auto text-[11px] font-mono">
        {stockConfigs.map((sc) => {
          const summary = summaries[sc.stockId];
          const isSelected = sc.stockId === selectedId;
          return (
            <div
              key={sc.stockId}
              onClick={() => simStore.getState().setSelectedStock(sc.stockId)}
              className={`grid grid-cols-[80px_1fr_1fr_1fr_1fr_1.5fr] px-4 py-2 border-b border-term-border/50 data-row items-center cursor-pointer transition-colors ${
                isSelected
                  ? "bg-accent-dim border-l-[3px] border-l-accent"
                  : "border-l-[3px] border-l-transparent hover:bg-white/[0.02]"
              }`}
            >
              <span
                className={`font-bold font-sans text-xs tracking-tight pl-1 ${
                  isSelected ? "text-white" : "text-slate-300"
                }`}
              >
                {sc.stockId}
              </span>
              {summary ? (
                <>
                  <span className="text-right text-white">
                    {formatPrice(summary.lastPrice ?? sc.ipoPrice)}
                  </span>
                  <span
                    className={`text-right flex items-center justify-end gap-0.5 ${
                      summary.changePercent > 0
                        ? "text-buy"
                        : summary.changePercent < 0
                          ? "text-sell"
                          : "text-slate-500"
                    }`}
                  >
                    {summary.changePercent > 0 ? (
                      <CaretUp size={10} weight="fill" />
                    ) : summary.changePercent < 0 ? (
                      <CaretDown size={10} weight="fill" />
                    ) : (
                      <Minus size={10} weight="fill" />
                    )}
                    {formatPercent(summary.changePercent)}
                  </span>
                  <span className="text-right text-slate-400">
                    {formatPrice(summary.dayHigh)}
                  </span>
                  <span className="text-right text-slate-400">
                    {formatPrice(summary.dayLow)}
                  </span>
                  <span className="text-right text-slate-300">
                    {formatVolume(summary.volume)}
                  </span>
                </>
              ) : (
                <span className="col-span-5 text-center text-slate-600">
                  --
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
