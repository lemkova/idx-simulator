import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import type { HawkesParams, StockConfig } from "../engine/types";

export interface SimStoreState {
  isRunning: boolean;
  speedMultiplier: number;
  hawkesParams: HawkesParams;
  elapsedSimTime: number;
  totalEvents: number;

  selectedStockId: string;

  stockSummaries: Record<
    string,
    {
      lastPrice: number | null;
      referencePrice: number;
      changePercent: number;
      dayHigh: number;
      dayLow: number;
      volume: number;
    }
  >;

  orderBookSnapshot: {
    bids: { price: number; totalQuantity: number; orderCount: number }[];
    asks: { price: number; totalQuantity: number; orderCount: number }[];
    spread: number;
    midPrice: number;
  } | null;

  recentTrades: {
    id: string;
    price: number;
    quantity: number;
    side: "buy" | "sell";
    simTimestamp: number;
  }[];

  candles: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];

  currentCandle: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null;

  hawkesIntensity: number;

  stockConfigs: StockConfig[];

  // Actions
  setSelectedStock: (id: string) => void;
  applySnapshot: (snap: {
    stocks: Record<
      string,
      {
        config: StockConfig;
        lastPrice: number | null;
        referencePrice: number;
        changePercent: number;
        dayHigh: number;
        dayLow: number;
        cumulativeVolume: number;
        orderBook: {
          bids: { price: number; totalQuantity: number; orderCount: number }[];
          asks: { price: number; totalQuantity: number; orderCount: number }[];
          spread: number;
          midPrice: number;
        };
        recentTrades: {
          id: string;
          price: number;
          quantity: number;
          buyerOrderId: string;
          sellerOrderId: string;
          simTimestamp: number;
        }[];
        candles: {
          time: number;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        }[];
        currentCandle: {
          time: number;
          open: number;
          high: number;
          low: number;
          close: number;
          volume: number;
        } | null;
      }
    >;
    elapsedSimTime: number;
    totalEvents: number;
    hawkesIntensities: Record<string, number>;
  }) => void;
  setRunning: (running: boolean) => void;
  setSpeed: (speed: number) => void;
  setHawkesParams: (params: Partial<HawkesParams>) => void;
}

export const simStore = createStore<SimStoreState>()(
  subscribeWithSelector((set, get) => ({
    isRunning: false,
    speedMultiplier: 60,
    hawkesParams: { mu: 0.5, alpha: 0.3, beta: 2.0 },
    elapsedSimTime: 0,
    totalEvents: 0,
    selectedStockId: "",
    stockSummaries: {},
    orderBookSnapshot: null,
    recentTrades: [],
    candles: [],
    currentCandle: null,
    hawkesIntensity: 0,
    stockConfigs: [],

    setSelectedStock: (id) => {
      set({ selectedStockId: id });
    },

    applySnapshot: (snap) => {
      const state = get();
      const summaries: Record<string, SimStoreState["stockSummaries"][string]> = {};
      for (const [id, s] of Object.entries(snap.stocks)) {
        summaries[id] = {
          lastPrice: s.lastPrice,
          referencePrice: s.referencePrice,
          changePercent: s.changePercent,
          dayHigh: s.dayHigh,
          dayLow: s.dayLow,
          volume: s.cumulativeVolume,
        };
      }

      const selId = state.selectedStockId;
      const sel = selId ? snap.stocks[selId] : null;

      set({
        elapsedSimTime: snap.elapsedSimTime,
        totalEvents: snap.totalEvents,
        stockSummaries: summaries,
        orderBookSnapshot: sel
          ? {
              bids: sel.orderBook.bids,
              asks: sel.orderBook.asks,
              spread: sel.orderBook.spread,
              midPrice: sel.orderBook.midPrice,
            }
          : null,
        recentTrades: (() => {
          if (!sel) return [];
          const MAX_TAPE = 50;
          const existing = state.recentTrades;
          const incoming = sel.recentTrades.map((t) => ({
            id: t.id,
            price: t.price,
            quantity: t.quantity,
            side: t.buyerOrderId < t.sellerOrderId ? ("buy" as const) : ("sell" as const),
            simTimestamp: t.simTimestamp,
          }));
          const merged = [...incoming, ...existing];
          return merged.slice(0, MAX_TAPE);
        })(),
        candles: sel
          ? sel.candles.map((c) => ({
              time: c.time,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
              volume: c.volume,
            }))
          : [],
        currentCandle: sel?.currentCandle
          ? {
              time: sel.currentCandle.time,
              open: sel.currentCandle.open,
              high: sel.currentCandle.high,
              low: sel.currentCandle.low,
              close: sel.currentCandle.close,
              volume: sel.currentCandle.volume,
            }
          : null,
        hawkesIntensity: selId
          ? (snap.hawkesIntensities[selId] ?? 0)
          : 0,
      });
    },

    setRunning: (running) => set({ isRunning: running }),
    setSpeed: (speed) => set({ speedMultiplier: speed }),
    setHawkesParams: (params) =>
      set((s) => ({
        hawkesParams: { ...s.hawkesParams, ...params },
      })),
  }))
);
