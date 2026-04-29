"use client";
import { useStore } from "zustand";
import { simStore } from "../stores/simulation-store";

export function useOrderBook() {
  return useStore(simStore, (s) => s.orderBookSnapshot);
}

export function useTradeTape() {
  return useStore(simStore, (s) => s.recentTrades);
}

export function useCandles() {
  return useStore(simStore, (s) => s.candles);
}

export function useCurrentCandle() {
  return useStore(simStore, (s) => s.currentCandle);
}

export function useStockList() {
  return useStore(simStore, (s) => s.stockConfigs);
}

export function useIsRunning() {
  return useStore(simStore, (s) => s.isRunning);
}

export function useElapsedSimTime() {
  return useStore(simStore, (s) => s.elapsedSimTime);
}

export function useTotalEvents() {
  return useStore(simStore, (s) => s.totalEvents);
}

export function useHawkesIntensity() {
  return useStore(simStore, (s) => s.hawkesIntensity);
}

export function useStockSummaries() {
  return useStore(simStore, (s) => s.stockSummaries);
}

export function useSelectedStockId() {
  return useStore(simStore, (s) => s.selectedStockId);
}
