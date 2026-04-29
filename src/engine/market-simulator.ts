import type {
  SimulationConfig,
  StockSimState,
  SimulationSnapshot,
  Trade,
  Candle,
  StockConfig,
  HawkesParams,
} from "./types";
import { OrderStatus, OrderType } from "./types";
import { HawkesProcess } from "./hawkes-process";
import { RandomAgent, createAgentPool } from "./random-agent";
import { LiquidityProvider } from "./liquidity-provider";
import { matchOrder } from "./matching-engine";
import { createOrderBook, getSnapshot } from "./order-book";
import { validateOrderPrice } from "./tick-rules";
import { createRng, type SeededRng } from "./prng";
import {
  WALL_CLOCK_TICK_MS,
  UI_THROTTLE_MS,
  MAX_TRADES_IN_TAPE,
  MAX_CANDLES,
  CANDLE_INTERVAL_SEC,
} from "./constants";

export type SnapshotCallback = (snap: SimulationSnapshot) => void;

export class MarketSimulator {
  private config: SimulationConfig;
  private stocks: Map<string, StockSimState>;
  private hawkes: Map<string, HawkesProcess>;
  private agents: RandomAgent[];
  private elapsedSimTime = 0;
  private totalEvents = 0;
  private running = false;
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private snapTimer: ReturnType<typeof setInterval> | null = null;
  private rng: SeededRng;
  private onSnapshot: SnapshotCallback | null = null;
  private pendingTrades: Trade[] = [];
  private currentHawkesIntensities: Record<string, number> = {};
  private lps: Map<string, LiquidityProvider> = new Map();

  constructor(config: SimulationConfig, seed?: number) {
    this.config = config;
    this.rng = createRng(seed ?? Date.now());
    this.stocks = new Map();
    this.hawkes = new Map();

    for (const sc of config.stocks) {
      this.stocks.set(sc.stockId, this.initStockState(sc));
      this.hawkes.set(
        sc.stockId,
        new HawkesProcess(config.hawkesParams)
      );
      this.currentHawkesIntensities[sc.stockId] =
        config.hawkesParams.mu;
      this.lps.set(sc.stockId, new LiquidityProvider());
    }

    this.agents = createAgentPool();
  }

  private initStockState(cfg: StockConfig): StockSimState {
    return {
      stockId: cfg.stockId,
      config: cfg,
      referencePrice: cfg.ipoPrice,
      lastPrice: cfg.ipoPrice,
      dayHigh: cfg.ipoPrice,
      dayLow: cfg.ipoPrice,
      cumulativeVolume: 0,
      orderBook: createOrderBook(),
      trades: [],
      currentCandle: null,
      candles: [],
      lastCandleTime: 0,
    };
  }

  setSnapshotCallback(cb: SnapshotCallback): void {
    this.onSnapshot = cb;
  }

  start(): void {
    if (this.running) return;
    this.running = true;

    this.tickTimer = setInterval(
      () => this.tick(),
      WALL_CLOCK_TICK_MS
    );
    this.snapTimer = setInterval(
      () => this.emitSnapshot(),
      UI_THROTTLE_MS
    );
  }

  stop(): void {
    this.running = false;
    if (this.tickTimer !== null) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.snapTimer !== null) {
      clearInterval(this.snapTimer);
      this.snapTimer = null;
    }
  }

  reset(): void {
    this.stop();
    this.elapsedSimTime = 0;
    this.totalEvents = 0;
    this.pendingTrades = [];
    for (const [id, sc] of this.stocks) {
      this.stocks.set(id, this.initStockState(sc.config));
      this.hawkes.get(id)?.reset();
      this.lps.set(id, new LiquidityProvider());
    }
    this.agents = createAgentPool();
  }

  updateHawkesParams(params: Partial<HawkesParams>): void {
    Object.assign(this.config.hawkesParams, params);
    for (const [id] of this.hawkes) {
      this.hawkes.set(
        id,
        new HawkesProcess(this.config.hawkesParams)
      );
    }
  }

  setSpeed(speed: number): void {
    this.config.speedMultiplier = Math.max(1, speed);
  }

  getElapsedSimTime(): number {
    return this.elapsedSimTime;
  }

  // ---- Private ----

  private tick(): void {
    if (!this.running) return;

    const wallDt = WALL_CLOCK_TICK_MS / 1000;
    const simDt = wallDt * this.config.speedMultiplier;
    this.elapsedSimTime += simDt;

    for (const [stockId, stock] of this.stocks) {
      const hp = this.hawkes.get(stockId)!;

      const eventCount = hp.tick(simDt, this.rng);
      this.totalEvents += eventCount;
      this.currentHawkesIntensities[stockId] = hp.getIntensity();

      if (eventCount === 0) {
        // Even with no random events, LP still needs to replenish
        // LP orders go through validation and matching
        const lp = this.lps.get(stockId)!;
        const lpOrders = lp.replenish(stock, this.elapsedSimTime);
        for (const order of lpOrders) {
          const result = matchOrder(order, stock);
          this.pendingTrades.push(...result.trades);
        }
        continue;
      }

      for (let i = 0; i < eventCount; i++) {
        const agent =
          this.agents[
            Math.floor(this.rng() * this.agents.length)
          ];
        const order = agent.generateOrder(
          stock,
          this.rng,
          this.elapsedSimTime
        );
        if (!order) continue;

        if (order.type === OrderType.LIMIT) {
          const { valid } = validateOrderPrice(
            order.price,
            stock.referencePrice
          );
          if (!valid) {
            order.status = OrderStatus.REJECTED;
            continue;
          }
        }

        const result = matchOrder(order, stock);
        this.pendingTrades.push(...result.trades);

        // Update reference price every 10 sim-minutes
        const REF_UPDATE_INTERVAL = 600;
        if (
          stock.lastPrice !== null &&
          Math.floor(this.elapsedSimTime / REF_UPDATE_INTERVAL) !==
            Math.floor(
              (this.elapsedSimTime - simDt) / REF_UPDATE_INTERVAL
            )
        ) {
          stock.referencePrice = stock.lastPrice;
        }
      }

      // Liquidity Provider: replenish both sides each tick
      {
        const lp = this.lps.get(stockId)!;
        const lpOrders = lp.replenish(stock, this.elapsedSimTime);
        for (const order of lpOrders) {
          const result = matchOrder(order, stock);
          this.pendingTrades.push(...result.trades);
        }
      }
    }

    this.updateCandles();
  }

  private updateCandles(): void {
    for (const stock of this.stocks.values()) {
      if (stock.currentCandle === null) {
        stock.currentCandle = {
          time:
            Math.floor(
              this.elapsedSimTime / CANDLE_INTERVAL_SEC
            ) * CANDLE_INTERVAL_SEC,
          open: stock.lastPrice ?? stock.referencePrice,
          high: stock.lastPrice ?? stock.referencePrice,
          low: stock.lastPrice ?? stock.referencePrice,
          close: stock.lastPrice ?? stock.referencePrice,
          volume: 0,
          tradeCount: 0,
        };
        stock.lastCandleTime = this.elapsedSimTime;
        continue;
      }

      const candleEnd =
        stock.currentCandle.time + CANDLE_INTERVAL_SEC;
      if (this.elapsedSimTime >= candleEnd) {
        stock.candles.push({ ...stock.currentCandle });
        if (stock.candles.length > MAX_CANDLES)
          stock.candles.shift();

        stock.currentCandle = {
          time: candleEnd,
          open: stock.currentCandle.close,
          high: stock.currentCandle.close,
          low: stock.currentCandle.close,
          close: stock.currentCandle.close,
          volume: 0,
          tradeCount: 0,
        };
        stock.lastCandleTime = this.elapsedSimTime;
      }
    }
  }

  private emitSnapshot(): void {
    if (!this.onSnapshot) return;

    const snap: SimulationSnapshot = {
      elapsedSimTime: this.elapsedSimTime,
      totalEvents: this.totalEvents,
      hawkesIntensities: { ...this.currentHawkesIntensities },
      stocks: {},
    };

    for (const [id, stock] of this.stocks) {
      const { bids, asks } = getSnapshot(stock.orderBook);
      const spread =
        asks.length > 0 && bids.length > 0
          ? asks[0].price - bids[0].price
          : 0;
      const midPrice =
        asks.length > 0 && bids.length > 0
          ? (asks[0].price + bids[0].price) / 2
          : (stock.lastPrice ?? stock.referencePrice);
      const changePercent =
        stock.lastPrice !== null && stock.referencePrice !== 0
          ? ((stock.lastPrice - stock.referencePrice) /
              stock.referencePrice) *
            100
          : 0;

      // Drain pending trades
      const newTrades = this.pendingTrades.filter(
        (t) => t.stockId === id
      );
      stock.trades.push(...newTrades);
      if (stock.trades.length > MAX_TRADES_IN_TAPE) {
        stock.trades.splice(
          0,
          stock.trades.length - MAX_TRADES_IN_TAPE
        );
      }

      snap.stocks[id] = {
        config: stock.config,
        lastPrice: stock.lastPrice,
        referencePrice: stock.referencePrice,
        dayHigh: stock.dayHigh,
        dayLow: stock.dayLow,
        cumulativeVolume: stock.cumulativeVolume,
        changePercent,
        orderBook: {
          stockId: id,
          bids,
          asks,
          spread,
          midPrice,
          simTimestamp: this.elapsedSimTime,
        },
        recentTrades: [...newTrades],
        candles: stock.candles.map((c) => ({ ...c })),
        currentCandle: stock.currentCandle
          ? { ...stock.currentCandle }
          : null,
      };
    }

    this.pendingTrades = [];
    this.onSnapshot(snap);
  }
}
