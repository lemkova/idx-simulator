// ---- Primitives ----
export type Price = number; // Integer Rupiah (no fractions)
export type Quantity = number; // Always in shares (not lots)

// ---- Enums ----
export enum Side {
  BUY = "buy",
  SELL = "sell",
}

export enum OrderType {
  MARKET = "market",
  LIMIT = "limit",
}

export enum OrderStatus {
  NEW = "new",
  PARTIALLY_FILLED = "partially_filled",
  FILLED = "filled",
  CANCELLED = "cancelled",
  REJECTED = "rejected",
}

// ---- Core Entities ----
export interface Order {
  id: string;
  stockId: string;
  agentId: string;
  side: Side;
  type: OrderType;
  price: Price; // 0 for MARKET (determined at match)
  quantity: Quantity;
  filledQuantity: Quantity;
  status: OrderStatus;
  simTimestamp: number;
}

export interface Trade {
  id: string;
  stockId: string;
  price: Price;
  quantity: Quantity;
  buyerOrderId: string;
  sellerOrderId: string;
  buyerAgentId: string;
  sellerAgentId: string;
  simTimestamp: number;
}

// ---- Order Book ----
export interface PriceLevel {
  price: Price;
  totalQuantity: Quantity;
  orderCount: number;
}

export interface OrderBookData {
  bids: Map<Price, Order[]>;
  asks: Map<Price, Order[]>;
  bidPrices: Price[]; // Descending
  askPrices: Price[]; // Ascending
}

export interface OrderBookSnapshot {
  stockId: string;
  bids: PriceLevel[];
  asks: PriceLevel[];
  spread: number;
  midPrice: number;
  simTimestamp: number;
}

// ---- Candles ----
export interface Candle {
  time: number;
  open: Price;
  high: Price;
  low: Price;
  close: Price;
  volume: Quantity;
  tradeCount: number;
}

// ---- Stock State ----
export interface StockSimState {
  stockId: string;
  config: StockConfig;
  referencePrice: Price;
  lastPrice: Price | null;
  dayHigh: Price;
  dayLow: Price;
  cumulativeVolume: Quantity;
  orderBook: OrderBookData;
  trades: Trade[];
  currentCandle: Candle | null;
  candles: Candle[];
  lastCandleTime: number;
}

// ---- Configuration ----
export interface StockConfig {
  stockId: string;
  name: string;
  ipoPrice: Price;
}

export interface HawkesParams {
  mu: number; // Baseline intensity (events/sim-second)
  alpha: number; // Excitation factor
  beta: number; // Decay rate (1/seconds)
}

export interface SimulationConfig {
  stocks: StockConfig[];
  hawkesParams: HawkesParams;
  speedMultiplier: number; // 1 = real-time, 60 = 1 wall-sec = 1 sim-min
  candleInterval: number; // Sim-seconds per candle (default 60)
}

// ---- Tick Table ----
export interface TickTier {
  maxPrice: number;
  tickSize: number;
  maxStepChange: number;
}

// ---- Snapshot ----
export interface SimulationSnapshot {
  stocks: Record<
    string,
    {
      config: StockConfig;
      lastPrice: Price | null;
      referencePrice: Price;
      dayHigh: Price;
      dayLow: Price;
      cumulativeVolume: Quantity;
      changePercent: number;
      orderBook: OrderBookSnapshot;
      recentTrades: Trade[];
      candles: Candle[];
      currentCandle: Candle | null;
    }
  >;
  elapsedSimTime: number;
  totalEvents: number;
  hawkesIntensities: Record<string, number>;
}
