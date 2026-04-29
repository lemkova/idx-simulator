"use client";
import { useHawkesIntensity, useIsRunning, useTotalEvents } from "../../hooks/useSimulation";

export function AgentMonitor() {
  const intensity = useHawkesIntensity();
  const isRunning = useIsRunning();
  const totalEvents = useTotalEvents();

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-300">
          Agent Activity
        </span>
      </div>
      <div className="p-3 space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-500">Hawkes Intensity</span>
            <span className="text-amber-400 font-mono">
              {intensity.toFixed(3)}
            </span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (intensity / 2) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-slate-500">Total Events</div>
            <div className="text-slate-200 font-mono text-sm">
              {totalEvents.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-700/50 rounded p-2">
            <div className="text-slate-500">Status</div>
            <div
              className={`font-mono text-sm ${
                isRunning ? "text-green-400" : "text-slate-400"
              }`}
            >
              {isRunning ? "Active" : "Stopped"}
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-600 space-y-0.5">
          <div>
            λ(t) = μ + Σ αβ·e<sup>-β(t-tᵢ)</sup>
          </div>
          <div>
            O(1) recursive: λ = μ + (λ<sub>prev</sub>-μ)·e<sup>-β·Δt</sup>
          </div>
        </div>
      </div>
    </div>
  );
}
