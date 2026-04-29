import type { Order, StockSimState, Price, OrderBookData } from "./types";
import { OrderType, OrderStatus, Side } from "./types";
import { LOT_SIZE } from "./constants";
import { getTickSize } from "./tick-rules";
import { removeOrder } from "./order-book";

const LP_AGENT_ID = "lp-provider";

export interface LiquidityProviderConfig {
  levels: number;
  lotsPerLevel: number;
}

const DEFAULT_CONFIG: LiquidityProviderConfig = {
  levels: 7,
  lotsPerLevel: 25,
};

export class LiquidityProvider {
  private config: LiquidityProviderConfig;
  private activeOrderIds: Set<string> = new Set();

  constructor(config?: Partial<LiquidityProviderConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  get agentId(): string {
    return LP_AGENT_ID;
  }

  /**
   * Cancel all LP orders currently on the book.
   */
  cancelAllOrders(state: StockSimState): void {
    const book = state.orderBook;
    // Collect first to avoid mutating the map during iteration
    const toCancel: { orderId: string; price: number; side: Side }[] = [];
    for (const side of [Side.BUY, Side.SELL]) {
      const map = side === Side.BUY ? book.bids : book.asks;
      for (const [price, orders] of map) {
        for (let i = orders.length - 1; i >= 0; i--) {
          if (orders[i].agentId === LP_AGENT_ID) {
            toCancel.push({ orderId: orders[i].id, price, side });
            orders[i].status = OrderStatus.CANCELLED;
          }
        }
      }
    }
    for (const { orderId, price, side } of toCancel) {
      removeOrder(orderId, price, side, book);
      this.activeOrderIds.delete(orderId);
    }
  }

  /**
   * Place fresh limit orders at N levels on both sides of the fair price.
   * Ensures the book always has visible depth.
   */
  replenish(
    state: StockSimState,
    simTime: number
  ): Order[] {
    // Cancel existing LP orders first
    this.cancelAllOrders(state);

    const fairPrice = this.getFairPrice(state);
    const tickSize = getTickSize(fairPrice);
    const { levels, lotsPerLevel } = this.config;

    const newOrders: Order[] = [];
    let orderIdx = 0;

    // Place bids below fair price
    for (let i = 0; i < levels; i++) {
      const offset = tickSize * (i + 1);
      const price = fairPrice - offset;
      if (price <= 0) continue;

      newOrders.push(
        this.createLimitOrder(state.stockId, Side.BUY, price, lotsPerLevel, simTime, orderIdx++)
      );
    }

    // Place asks above fair price
    for (let i = 0; i < levels; i++) {
      const offset = tickSize * (i + 1);
      const price = fairPrice + offset;

      newOrders.push(
        this.createLimitOrder(state.stockId, Side.SELL, price, lotsPerLevel, simTime, orderIdx++)
      );
    }

    return newOrders;
  }

  private getFairPrice(state: StockSimState): Price {
    // Use mid price from order book if available
    const book = state.orderBook;
    if (book.bidPrices.length > 0 && book.askPrices.length > 0) {
      const bestBid = book.bidPrices[0];
      const bestAsk = book.askPrices[0];
      const tickSize = getTickSize(state.lastPrice ?? state.referencePrice);
      const mid = Math.round((bestBid + bestAsk) / (2 * tickSize)) * tickSize;
      return Math.max(tickSize, mid);
    }
    // Fall back to last price or reference
    return state.lastPrice ?? state.referencePrice;
  }

  private createLimitOrder(
    stockId: string,
    side: Side,
    price: Price,
    lots: number,
    simTime: number,
    idx: number
  ): Order {
    const id = `lp-${stockId}-${simTime}-${idx}`;
    this.activeOrderIds.add(id);
    return {
      id,
      stockId,
      agentId: LP_AGENT_ID,
      side,
      type: OrderType.LIMIT,
      price,
      quantity: lots * LOT_SIZE,
      filledQuantity: 0,
      status: OrderStatus.NEW,
      simTimestamp: simTime,
    };
  }
}
