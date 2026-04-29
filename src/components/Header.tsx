"use client";
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
    <header className="bg-slate-800 border-b border-slate-700 px-3 py-2">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-amber-400 whitespace-nowrap">
          IDX Sim
        </h1>
        <div className="flex gap-1">
          {stockConfigs.map((sc) => (
            <button
              key={sc.stockId}
              onClick={() =>
                simStore.getState().setSelectedStock(sc.stockId)
              }
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedId === sc.stockId
                  ? "bg-amber-500 text-slate-900"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {sc.stockId}
            </button>
          ))}
        </div>
        <ControlPanel onReset={onReset} />
        <div className="ml-auto flex items-center gap-4 text-xs text-slate-400">
          <span>
            Sim time:{" "}
            <span className="text-slate-200 font-mono">
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
            <span className="flex items-center gap-1 text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
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
