"use client";
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
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">
          Market Overview
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700 text-slate-500">
              <th className="text-left px-3 py-1.5">Stock</th>
              <th className="text-right px-3 py-1.5">Last</th>
              <th className="text-right px-3 py-1.5">Chg%</th>
              <th className="text-right px-3 py-1.5">High</th>
              <th className="text-right px-3 py-1.5">Low</th>
              <th className="text-right px-3 py-1.5">Vol (Lots)</th>
            </tr>
          </thead>
          <tbody>
            {stockConfigs.map((sc) => {
              const summary = summaries[sc.stockId];
              const isSelected = sc.stockId === selectedId;
              return (
                <tr
                  key={sc.stockId}
                  onClick={() =>
                    simStore.getState().setSelectedStock(sc.stockId)
                  }
                  className={`border-b border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-700/30 ${
                    isSelected ? "bg-slate-700/50" : ""
                  }`}
                >
                  <td className="px-3 py-1.5">
                    <div className="font-medium text-slate-200">
                      {sc.stockId}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {sc.name}
                    </div>
                  </td>
                  {summary ? (
                    <>
                      <td className="text-right px-3 py-1.5 font-mono text-slate-200">
                        {formatPrice(summary.lastPrice ?? sc.ipoPrice)}
                      </td>
                      <td
                        className={`text-right px-3 py-1.5 font-mono ${
                          summary.changePercent >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {formatPercent(summary.changePercent)}
                      </td>
                      <td className="text-right px-3 py-1.5 font-mono text-green-400">
                        {formatPrice(summary.dayHigh)}
                      </td>
                      <td className="text-right px-3 py-1.5 font-mono text-red-400">
                        {formatPrice(summary.dayLow)}
                      </td>
                      <td className="text-right px-3 py-1.5 font-mono text-slate-300">
                        {formatVolume(summary.volume)}
                      </td>
                    </>
                  ) : (
                    <td colSpan={5} className="text-center text-slate-600 py-1.5">
                      --
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
