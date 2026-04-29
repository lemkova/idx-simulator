"use client";
import { useEffect, useRef } from "react";
import { MarketSimulator } from "../engine/market-simulator";
import type { StockConfig } from "../engine/types";
import { simStore } from "../stores/simulation-store";
import { Header } from "./Header";
import { OrderBook } from "./order-book/OrderBook";
import { PriceChart } from "./charts/PriceChart";
import { TradeTape } from "./trades/TradeTape";
import { MarketOverview } from "./dashboard/MarketOverview";
import { AgentMonitor } from "./agents/AgentMonitor";

const STOCK_CONFIGS: StockConfig[] = [
  { stockId: "BBCA", name: "Bank BCA", ipoPrice: 1250 },
  { stockId: "BBRI", name: "Bank BRI", ipoPrice: 800 },
  { stockId: "TLKM", name: "Telkom", ipoPrice: 420 },
  { stockId: "ASII", name: "Astra", ipoPrice: 3200 },
  { stockId: "UNVR", name: "Unilever", ipoPrice: 6800 },
];

export default function AppShell() {
  const simRef = useRef<MarketSimulator | null>(null);

  useEffect(() => {
    simStore.setState({
      stockConfigs: STOCK_CONFIGS,
      selectedStockId: STOCK_CONFIGS[0].stockId,
    });

    const sim = new MarketSimulator({
      stocks: STOCK_CONFIGS,
      hawkesParams: { mu: 0.5, alpha: 0.3, beta: 2.0 },
      speedMultiplier: 60,
      candleInterval: 60,
    });

    sim.setSnapshotCallback((snap) => {
      simStore.getState().applySnapshot(snap);
    });

    simRef.current = sim;

    const unsubRunning = simStore.subscribe(
      (s) => s.isRunning,
      (running) => {
        if (running) sim.start();
        else sim.stop();
      }
    );

    const unsubSpeed = simStore.subscribe(
      (s) => s.speedMultiplier,
      (speed) => sim.setSpeed(speed)
    );

    const unsubHawkes = simStore.subscribe(
      (s) => s.hawkesParams,
      (params) => sim.updateHawkesParams(params),
      { equalityFn: (a, b) =>
          a.mu === b.mu && a.alpha === b.alpha && a.beta === b.beta
      }
    );

    return () => {
      unsubRunning();
      unsubSpeed();
      unsubHawkes();
      sim.stop();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <Header
        onReset={() => {
          simRef.current?.reset();
          simStore.setState({ isRunning: false });
        }}
      />
      <main className="flex-1 w-full max-w-[1920px] mx-auto p-2 xl:p-3 grid grid-cols-1 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr_320px] gap-2 xl:gap-3 overflow-hidden min-h-0">
        <OrderBook />
        <section className="flex flex-col gap-2 xl:gap-3 min-h-0">
          <PriceChart />
          <MarketOverview />
        </section>
        <aside className="hidden xl:flex flex-col gap-3 min-h-0">
          <TradeTape />
          <AgentMonitor />
        </aside>
      </main>
    </div>
  );
}
