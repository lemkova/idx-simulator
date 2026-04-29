import type { Order, OrderBookData, PriceLevel, Price } from "./types";
import { Side } from "./types";

export function createOrderBook(): OrderBookData {
  return {
    bids: new Map(),
    asks: new Map(),
    bidPrices: [],
    askPrices: [],
  };
}

function binaryInsertDescending(arr: Price[], price: Price): void {
  let lo = 0,
    hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] > price) lo = mid + 1;
    else hi = mid;
  }
  arr.splice(lo, 0, price);
}

function binaryInsertAscending(arr: Price[], price: Price): void {
  let lo = 0,
    hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] < price) lo = mid + 1;
    else hi = mid;
  }
  arr.splice(lo, 0, price);
}

export function addOrder(order: Order, book: OrderBookData): void {
  const side = order.side === Side.BUY ? "bids" : "asks";
  const priceKey = order.price;
  const level = book[side].get(priceKey);

  if (level) {
    level.push(order);
  } else {
    book[side].set(priceKey, [order]);
    if (order.side === Side.BUY) {
      binaryInsertDescending(book.bidPrices, priceKey);
    } else {
      binaryInsertAscending(book.askPrices, priceKey);
    }
  }
}

export function removeOrder(
  orderId: string,
  price: Price,
  side: Side,
  book: OrderBookData
): void {
  const mapKey = side === Side.BUY ? "bids" : "asks";
  const arrKey = side === Side.BUY ? "bidPrices" : "askPrices";
  const level = book[mapKey].get(price);
  if (!level) return;

  const idx = level.findIndex((o) => o.id === orderId);
  if (idx !== -1) level.splice(idx, 1);

  if (level.length === 0) {
    book[mapKey].delete(price);
    const prices = book[arrKey];
    const priceIdx = prices.indexOf(price);
    if (priceIdx !== -1) prices.splice(priceIdx, 1);
  }
}

export function getSnapshot(
  book: OrderBookData,
  depth: number
): { bids: PriceLevel[]; asks: PriceLevel[] } {
  function toLevels(
    prices: Price[],
    map: Map<Price, Order[]>
  ): PriceLevel[] {
    return prices.slice(0, depth).map((price) => {
      const orders = map.get(price)!;
      return {
        price,
        totalQuantity: orders.reduce(
          (sum, o) => sum + (o.quantity - o.filledQuantity),
          0
        ),
        orderCount: orders.length,
      };
    });
  }
  return {
    bids: toLevels(book.bidPrices, book.bids),
    asks: toLevels(book.askPrices, book.asks),
  };
}
