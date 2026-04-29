import type { Order, StockSimState, Price } from "./types";
import { Side, OrderType, OrderStatus } from "./types";
import { LOT_SIZE, ARB_FACTOR, ARA_FACTOR } from "./constants";
import { getTickSize, snapToTick, ceilToTick, floorToTick } from "./tick-rules";
import type { SeededRng } from "./prng";

export interface AgentParams {
  marketOrderProb: number;
  buyProb: number;
  offsetMeanTicks: number;
  sizeLogMean: number;
  sizeLogStd: number;
  cancelProb: number;
}

const DEFAULT_PARAMS: AgentParams = {
  marketOrderProb: 0.25,
  buyProb: 0.5,
  offsetMeanTicks: 4,
  sizeLogMean: Math.log(2.5),
  sizeLogStd: 0.6,
  cancelProb: 0.05,
};

export class RandomAgent {
  readonly id: string;
  private params: AgentParams;

  constructor(id: string, params?: Partial<AgentParams>) {
    this.id = id;
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  generateOrder(
    stock: StockSimState,
    rng: SeededRng,
    currentSimTime: number
  ): Order | null {
    const side = rng() < this.params.buyProb ? Side.BUY : Side.SELL;

    const isMarket = rng() < this.params.marketOrderProb;

    const lots = Math.max(
      1,
      Math.round(
        this.sampleLogNormal(
          this.params.sizeLogMean,
          this.params.sizeLogStd,
          rng
        )
      )
    );
    const quantity = lots * LOT_SIZE;

    const refPrice = stock.lastPrice ?? stock.referencePrice;
    const tickSize = getTickSize(refPrice);
    let price: Price;

    if (isMarket) {
      price = 0;
    } else {
      const direction = side === Side.BUY ? -1 : 1;
      const offsetTicks = Math.max(
        1,
        Math.round(
          this.sampleExponential(
            1 / this.params.offsetMeanTicks,
            rng
          )
        )
      );
      const offset = offsetTicks * tickSize * direction;
      price = snapToTick(refPrice + offset, tickSize);

      // Clamp to ARB/ARA
      const arb = ceilToTick(
        stock.referencePrice * ARB_FACTOR,
        tickSize
      );
      const ara = floorToTick(
        stock.referencePrice * ARA_FACTOR,
        tickSize
      );
      price = Math.max(arb, Math.min(ara, price));
    }

    return {
      id: `o-${this.id}-${currentSimTime}-${Math.random().toString(36).slice(2, 8)}`,
      stockId: stock.stockId,
      agentId: this.id,
      side,
      type: isMarket ? OrderType.MARKET : OrderType.LIMIT,
      price,
      quantity,
      filledQuantity: 0,
      status: OrderStatus.NEW,
      simTimestamp: currentSimTime,
    };
  }

  private sampleLogNormal(
    mu: number,
    sigma: number,
    rng: SeededRng
  ): number {
    return Math.exp(mu + sigma * this.sampleNormal(rng));
  }

  private sampleExponential(
    rate: number,
    rng: SeededRng
  ): number {
    return -Math.log(Math.max(1 - rng(), 1e-10)) / rate;
  }

  private sampleNormal(rng: SeededRng): number {
    const u1 = rng();
    const u2 = rng();
    return (
      Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) *
      Math.cos(2 * Math.PI * u2)
    );
  }
}

export function createAgentPool(): RandomAgent[] {
  const configs: Partial<AgentParams>[] = [
    { marketOrderProb: 0.1, offsetMeanTicks: 5, sizeLogMean: Math.log(1.5), sizeLogStd: 0.4, cancelProb: 0.1, buyProb: 0.5 },
    { marketOrderProb: 0.5, offsetMeanTicks: 2, sizeLogMean: Math.log(3),   sizeLogStd: 0.5, cancelProb: 0.02, buyProb: 0.5 },
    { marketOrderProb: 0.05, offsetMeanTicks: 8, sizeLogMean: Math.log(10),  sizeLogStd: 0.7, cancelProb: 0.05, buyProb: 0.5 },
    { marketOrderProb: 0.6, offsetMeanTicks: 1, sizeLogMean: Math.log(2),   sizeLogStd: 0.3, cancelProb: 0.2, buyProb: 0.5 },
    { marketOrderProb: 0.2, offsetMeanTicks: 3, sizeLogMean: Math.log(5),   sizeLogStd: 0.6, cancelProb: 0.15, buyProb: 0.5 },
  ];
  const counts = [8, 4, 3, 3, 2];
  const agents: RandomAgent[] = [];
  let idx = 0;
  for (let g = 0; g < configs.length; g++) {
    for (let i = 0; i < counts[g]; i++) {
      agents.push(new RandomAgent(`agent-${idx++}`, configs[g]));
    }
  }
  return agents;
}
