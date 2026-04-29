"use client";
import { Cpu } from "@phosphor-icons/react";
import { useHawkesIntensity, useIsRunning, useTotalEvents } from "../../hooks/useSimulation";

export function AgentMonitor() {
  const intensity = useHawkesIntensity();
  const isRunning = useIsRunning();
  const totalEvents = useTotalEvents();

  return (
    <div className="panel h-[220px] shrink-0 bg-term-panel border border-term-border rounded-lg flex flex-col overflow-hidden bg-gradient-to-br from-term-panel to-[#0c121b]">
      <div className="h-10 shrink-0 border-b border-term-border flex items-center justify-between px-3">
        <h2 className="text-xs font-semibold text-accent tracking-wide uppercase flex items-center gap-2">
          <Cpu size={14} weight="fill" /> Agent Monitor
        </h2>
        <span className="text-[9px] font-mono border border-term-border px-1.5 py-0.5 rounded text-buy bg-buy-dim">
          {isRunning ? "LIVE" : "IDLE"}
        </span>
      </div>

      <div className="p-3 flex flex-col gap-3 flex-1">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Hawkes Intensity <span className="normal-case font-mono text-slate-500">lambda(t)</span>
            </span>
            <span className="text-[10px] font-mono text-white">
              {intensity.toFixed(1)} req/s
            </span>
          </div>
          <div className="h-2.5 w-full bg-term-base rounded-sm border border-term-border overflow-hidden relative">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,#1a2435_25px)] bg-[length:25px_100%] opacity-50" />
            <div
              className="h-full bg-gradient-to-r from-accent to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(100, (intensity / 2) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="bg-term-base/80 border border-term-border rounded p-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)] pointer-events-none" />
          <div className="font-mono text-xs text-slate-300 flex items-center gap-1.5 relative z-10 justify-center">
            <span className="text-accent font-bold">λ(t)</span>
            <span className="text-slate-500">=</span>
            <span className="text-white">μ</span>
            <span className="text-slate-500">+</span>
            <span className="flex items-center">
              <span className="text-white">α</span>
              <span className="text-base leading-[0] ml-0.5 mr-0.5 mt-1">∑</span>
              <span className="text-sky-300 text-[10px]">
                e<sup className="text-[8px] text-slate-400">-β(t-tᵢ)</sup>
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto">
          <div className="bg-term-base p-2 rounded border border-term-border flex flex-col justify-between h-[44px]">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold">
              Total Events
            </span>
            <span className="text-white font-mono text-xs">
              {totalEvents.toLocaleString()}
            </span>
          </div>
          <div className="bg-term-base p-2 rounded border border-term-border flex flex-col justify-between h-[44px]">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider font-semibold">
              Status
            </span>
            <span
              className={`font-mono text-xs ${
                isRunning ? "text-buy" : "text-slate-400"
              }`}
            >
              {isRunning ? "Active" : "Stopped"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
