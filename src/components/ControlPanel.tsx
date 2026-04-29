"use client";
import { useStore } from "zustand";
import { simStore } from "../stores/simulation-store";

interface ControlPanelProps {
  onReset: () => void;
}

export function ControlPanel({ onReset }: ControlPanelProps) {
  const isRunning = useStore(simStore, (s) => s.isRunning);
  const speed = useStore(simStore, (s) => s.speedMultiplier);
  const hawkesParams = useStore(simStore, (s) => s.hawkesParams);

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => simStore.getState().setRunning(!isRunning)}
        className={`px-4 py-1.5 rounded text-sm font-semibold transition-colors ${
          isRunning
            ? "bg-red-500 hover:bg-red-400 text-white"
            : "bg-green-500 hover:bg-green-400 text-white"
        }`}
      >
        {isRunning ? "Stop" : "Start"}
      </button>

      <div className="flex items-center gap-1.5 text-xs">
        <label className="text-slate-400">Speed</label>
        <select
          value={speed}
          onChange={(e) =>
            simStore.getState().setSpeed(Number(e.target.value))
          }
          className="bg-slate-700 text-slate-200 rounded px-2 py-1 text-xs border border-slate-600"
        >
          <option value="1">1x</option>
          <option value="10">10x</option>
          <option value="30">30x</option>
          <option value="60">60x</option>
          <option value="120">120x</option>
          <option value="300">300x</option>
        </select>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <HawkesSlider
          label="μ"
          value={hawkesParams.mu}
          min={0.1}
          max={2}
          step={0.1}
          onChange={(v) =>
            simStore.getState().setHawkesParams({ mu: v })
          }
        />
        <HawkesSlider
          label="α"
          value={hawkesParams.alpha}
          min={0.1}
          max={0.9}
          step={0.05}
          onChange={(v) =>
            simStore.getState().setHawkesParams({ alpha: v })
          }
        />
        <HawkesSlider
          label="β"
          value={hawkesParams.beta}
          min={0.5}
          max={5}
          step={0.25}
          onChange={(v) =>
            simStore.getState().setHawkesParams({ beta: v })
          }
        />
      </div>

      <button
        onClick={onReset}
        className="px-3 py-1.5 rounded text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
      >
        Reset
      </button>
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
    <div className="flex items-center gap-1">
      <label className="text-slate-500 w-3">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-14 h-1 accent-amber-400"
        title={`${label}=${value}`}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
