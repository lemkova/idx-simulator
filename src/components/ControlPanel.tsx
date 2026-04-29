"use client";
import { ArrowCounterClockwise, Play, Stop } from "@phosphor-icons/react";
import { useStore } from "zustand";
import { simStore } from "../stores/simulation-store";

interface ControlPanelProps {
  onReset: () => void;
}

const SPEEDS = [1, 10, 30, 60, 120, 300];

export function ControlPanel({ onReset }: ControlPanelProps) {
  const isRunning = useStore(simStore, (s) => s.isRunning);
  const speed = useStore(simStore, (s) => s.speedMultiplier);
  const hawkesParams = useStore(simStore, (s) => s.hawkesParams);

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3 bg-term-panel px-3 py-1.5 rounded-md border border-term-border relative">
        <span className="absolute -top-0 left-2 bg-term-panel px-1 text-[9px] text-slate-500 font-mono tracking-widest uppercase rounded">
          Hawkes Params
        </span>
        <HawkesSlider
          label="mu"
          value={hawkesParams.mu}
          min={0.1}
          max={2}
          step={0.1}
          onChange={(v) => simStore.getState().setHawkesParams({ mu: v })}
        />
        <div className="w-px h-6 bg-term-border" />
        <HawkesSlider
          label="alp"
          value={hawkesParams.alpha}
          min={0.1}
          max={0.9}
          step={0.05}
          onChange={(v) => simStore.getState().setHawkesParams({ alpha: v })}
        />
        <div className="w-px h-6 bg-term-border" />
        <HawkesSlider
          label="bet"
          value={hawkesParams.beta}
          min={0.5}
          max={5}
          step={0.25}
          onChange={(v) => simStore.getState().setHawkesParams({ beta: v })}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-term-panel rounded-md border border-term-border overflow-hidden">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => simStore.getState().setSpeed(s)}
              className={`px-2 py-1 text-[10px] font-mono border-r border-term-border last:border-r-0 transition-colors ${
                speed === s
                  ? "text-accent bg-accent-dim"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        <button
          onClick={() => simStore.getState().setRunning(!isRunning)}
          className={`h-8 px-4 font-bold text-[11px] tracking-wide uppercase rounded-md transition-all flex items-center gap-1.5 ${
            isRunning
              ? "bg-sell text-white shadow-[0_0_12px_rgba(244,63,94,0.2)] hover:bg-rose-500"
              : "bg-buy text-term-base shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
          }`}
        >
          {isRunning ? (
            <>
              <Stop size={14} weight="fill" /> Stop
            </>
          ) : (
            <>
              <Play size={14} weight="fill" /> Start
            </>
          )}
        </button>

        <button
          onClick={onReset}
          className="h-8 w-8 flex items-center justify-center bg-term-panel border border-term-border rounded-md text-slate-400 hover:text-white hover:bg-white/[0.03] transition-all"
        >
          <ArrowCounterClockwise size={14} />
        </button>
      </div>
    </div>
  );
}

function HawkesSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-16">
      <div className="flex justify-between text-[9px] font-mono">
        <span className="text-slate-400">
          {label}
        </span>
        <span className="text-accent">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
