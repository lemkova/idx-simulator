import type { TickTier } from "./types";

export const LOT_SIZE = 500;

export const ARB_FACTOR = 0.9; // -10%
export const ARA_FACTOR = 1.25; // +25%

export const TICK_TABLE: TickTier[] = [
  { maxPrice: 200, tickSize: 1, maxStepChange: 10 },
  { maxPrice: 500, tickSize: 2, maxStepChange: 20 },
  { maxPrice: 2000, tickSize: 5, maxStepChange: 50 },
  { maxPrice: 5000, tickSize: 10, maxStepChange: 100 },
  { maxPrice: Infinity, tickSize: 25, maxStepChange: 250 },
];

// Timing
export const WALL_CLOCK_TICK_MS = 50; // 20 wall-ticks/sec
export const UI_THROTTLE_MS = 80; // ~12 store updates/sec
export const MAX_TRADES_IN_TAPE = 100;
export const MAX_CANDLES = 1000;
export const CANDLE_INTERVAL_SEC = 60; // 1-min candles in sim-time
