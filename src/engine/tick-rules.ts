import { TICK_TABLE, ARB_FACTOR, ARA_FACTOR } from "./constants";
import type { TickTier, Price } from "./types";

export function getTickTier(price: Price): TickTier {
  for (const tier of TICK_TABLE) {
    if (price <= tier.maxPrice) return tier;
  }
  return TICK_TABLE[TICK_TABLE.length - 1];
}

export function getTickSize(price: Price): number {
  return getTickTier(price).tickSize;
}

export function getMaxStepChange(price: Price): number {
  return getTickTier(price).maxStepChange;
}

export function floorToTick(price: number, tickSize: number): number {
  return Math.floor(price / tickSize) * tickSize;
}

export function ceilToTick(price: number, tickSize: number): number {
  return Math.ceil(price / tickSize) * tickSize;
}

export function snapToTick(price: number, tickSize: number): number {
  return Math.round(price / tickSize) * tickSize;
}

export function getArbAraBounds(referencePrice: Price): {
  arb: Price;
  ara: Price;
} {
  const tickSize = getTickSize(referencePrice);
  const arbRaw = referencePrice * ARB_FACTOR;
  const araRaw = referencePrice * ARA_FACTOR;
  return {
    arb: ceilToTick(arbRaw, tickSize),
    ara: floorToTick(araRaw, tickSize),
  };
}

export function validateOrderPrice(
  price: Price,
  referencePrice: Price
): { valid: boolean; reason?: string } {
  const tickSize = getTickSize(price);
  if (price % tickSize !== 0) {
    return {
      valid: false,
      reason: `Price ${price} not multiple of tick size ${tickSize}`,
    };
  }
  const { arb, ara } = getArbAraBounds(referencePrice);
  if (price < arb || price > ara) {
    return {
      valid: false,
      reason: `Price ${price} outside ARB(${arb})/ARA(${ara})`,
    };
  }
  return { valid: true };
}
