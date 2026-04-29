import type { Order, Trade, StockSimState, Price } from "./types";
import { Side, OrderType, OrderStatus } from "./types";
import { addOrder, removeOrder } from "./order-book";

let tradeCounter = 0;
function nextTradeId(): string {
  return `t${++tradeCounter}`;
}

export interface MatchResult {
  trades: Trade[];
  updatedLastPrice: Price | null;
}

export function matchOrder(order: Order, state: StockSimState): MatchResult {
  const trades: Trade[] = [];
  const book = state.orderBook;
  const isBuy = order.side === Side.BUY;

  const levels = isBuy
    ? { prices: book.askPrices, map: book.asks }
    : { prices: book.bidPrices, map: book.bids };

  while (
    order.filledQuantity < order.quantity &&
    levels.prices.length > 0
  ) {
    const bestPrice = levels.prices[0];
    const ordersAtLevel = levels.map.get(bestPrice)!;

    // For limit orders: stop if price doesn't cross
    if (order.type === OrderType.LIMIT) {
      if (
        (isBuy && order.price < bestPrice) ||
        (!isBuy && order.price > bestPrice)
      )
        break;
    }

    while (
      ordersAtLevel.length > 0 &&
      order.filledQuantity < order.quantity
    ) {
      const restingOrder = ordersAtLevel[0];
      const available =
        restingOrder.quantity - restingOrder.filledQuantity;
      const matchQty = Math.min(
        order.quantity - order.filledQuantity,
        available
      );

      order.filledQuantity += matchQty;
      restingOrder.filledQuantity += matchQty;

      const trade: Trade = {
        id: nextTradeId(),
        stockId: order.stockId,
        price: bestPrice,
        quantity: matchQty,
        buyerOrderId: isBuy ? order.id : restingOrder.id,
        sellerOrderId: isBuy ? restingOrder.id : order.id,
        buyerAgentId: isBuy ? order.agentId : restingOrder.agentId,
        sellerAgentId: isBuy ? restingOrder.agentId : order.agentId,
        simTimestamp: order.simTimestamp,
      };
      trades.push(trade);

      state.lastPrice = bestPrice;
      state.dayHigh = Math.max(state.dayHigh, bestPrice);
      state.dayLow = Math.min(state.dayLow, bestPrice);
      state.cumulativeVolume += matchQty;

      if (state.currentCandle) {
        state.currentCandle.close = bestPrice;
        state.currentCandle.high = Math.max(
          state.currentCandle.high,
          bestPrice
        );
        state.currentCandle.low = Math.min(
          state.currentCandle.low,
          bestPrice
        );
        state.currentCandle.volume += matchQty;
        state.currentCandle.tradeCount += 1;
      }

      if (restingOrder.filledQuantity >= restingOrder.quantity) {
        restingOrder.status = OrderStatus.FILLED;
        ordersAtLevel.shift();
        removeOrder(
          restingOrder.id,
          bestPrice,
          isBuy ? Side.SELL : Side.BUY,
          book
        );
      }
    }

    if (ordersAtLevel.length === 0) {
      levels.map.delete(bestPrice);
      levels.prices.shift();
    }
  }

  if (order.filledQuantity >= order.quantity) {
    order.status = OrderStatus.FILLED;
  } else if (order.filledQuantity > 0) {
    order.status = OrderStatus.PARTIALLY_FILLED;
  }

  // Unfilled limit order rests on book
  if (
    order.type === OrderType.LIMIT &&
    order.filledQuantity < order.quantity
  ) {
    order.status =
      order.filledQuantity > 0
        ? OrderStatus.PARTIALLY_FILLED
        : OrderStatus.NEW;
    addOrder(order, book);
  }

  const lastTradePrice =
    trades.length > 0 ? trades[trades.length - 1].price : null;
  return { trades, updatedLastPrice: lastTradePrice };
}
