"use client";
import { TrendUp } from "@phosphor-icons/react";
import { useStockList, useSelectedStockId, useIsRunning, useElapsedSimTime, useTotalEvents } from "../hooks/useSimulation";
import { simStore } from "../stores/simulation-store";
import { ControlPanel } from "./ControlPanel";

interface HeaderProps {
  onReset: () => void;
}

export function Header({ onReset }: HeaderProps) {
  const stockConfigs = useStockList();
  const selectedId = useSelectedStockId();
  const isRunning = useIsRunning();
  const elapsedTime = useElapsedSimTime();
  const totalEvents = useTotalEvents();

  return (
    <header className="h-[52px] shrink-0 border-b border-term-border bg-term-base/90 backdrop-blur-md px-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-3 w-48">
        <div className="h-6 w-6 bg-accent rounded-sm flex items-center justify-center text-term-base font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]">
          <TrendUp size={14} weight="fill" />
        </div>
        <span className="font-bold text-white tracking-tight uppercase text-sm">
          IDX Sim
        </span>
      </div>

      <div className="flex items-center gap-1.5 bg-term-panel p-1 rounded-full border border-term-border">
        {stockConfigs.map((sc) => (
          <button
            key={sc.stockId}
            onClick={() => simStore.getState().setSelectedStock(sc.stockId)}
            className={`px-4 py-1 text-[11px] rounded-full transition-all active:scale-95 ${
              selectedId === sc.stockId
                ? "font-semibold bg-accent text-term-base shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                : "font-medium text-slate-400 hover:text-white hover:bg-white/[0.03]"
            }`}
          >
            {sc.stockId}
          </button>
        ))}
      </div>

      <ControlPanel onReset={onReset} />

      <div className="flex items-center gap-4 text-xs text-slate-400 ml-auto">
        <span className="flex items-center gap-1.5">
          {isRunning && (
            <span className="flex h-2 w-2 rounded-full bg-buy animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          )}
          <span className="text-slate-300 font-mono text-[10px] w-[60px]">
            {formatTime(elapsedTime)}
          </span>
        </span>
        <span>
          Events:{" "}
          <span className="text-slate-200 font-mono">
            {totalEvents.toLocaleString()}
          </span>
        </span>
        {isRunning && (
          <span className="text-[10px] font-semibold text-buy tracking-wide uppercase">
            LIVE
          </span>
        )}
      </div>
    </header>
  );
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
