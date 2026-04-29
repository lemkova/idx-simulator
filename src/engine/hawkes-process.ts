import type { HawkesParams } from "./types";

/**
 * Hawkes process with O(1) recursive intensity update.
 *
 * lambda(t) = mu + sum_{t_i < t} alpha * beta * exp(-beta * (t - t_i))
 *
 * Between events: lambda(t) = mu + (lambda_prev - mu) * exp(-beta * dt)
 * On event: lambda jumps by alpha * beta
 */
export class HawkesProcess {
  private intensity: number;
  private lastTime: number;
  readonly mu: number;
  readonly alpha: number;
  readonly beta: number;

  constructor(params: HawkesParams) {
    this.mu = params.mu;
    this.alpha = params.alpha;
    this.beta = params.beta;
    this.intensity = params.mu;
    this.lastTime = 0;
  }

  private decayTo(t: number): void {
    const dt = t - this.lastTime;
    if (dt > 0) {
      this.intensity =
        this.mu +
        (this.intensity - this.mu) * Math.exp(-this.beta * dt);
      this.lastTime = t;
    }
  }

  getIntensity(): number {
    return this.intensity;
  }

  /**
   * Tick: advance by dt sim-seconds, sample Poisson(lambda * dt) events,
   * jump intensity accordingly. Returns event count.
   */
  tick(dt: number, rng: () => number = Math.random): number {
    const lambda = this.intensity;
    const expected = lambda * dt;
    const count = this.samplePoisson(expected, rng);

    if (count > 0) {
      this.intensity += count * this.alpha * this.beta;
    }

    this.lastTime += dt;

    // Decay intensity toward baseline for the dt interval
    this.intensity =
      this.mu +
      (this.intensity - this.mu) * Math.exp(-this.beta * dt);

    return count;
  }

  reset(): void {
    this.intensity = this.mu;
    this.lastTime = 0;
  }

  // ---- Poisson sampling ----
  private samplePoisson(
    lambda: number,
    rng: () => number
  ): number {
    if (lambda <= 0) return 0;
    if (lambda > 30) {
      return Math.max(
        0,
        Math.round(
          lambda + Math.sqrt(lambda) * this.sampleNormal(rng)
        )
      );
    }
    // Knuth's algorithm
    let count = 0;
    let prod = 1.0;
    const L = Math.exp(-lambda);
    while (prod > L) {
      prod *= rng();
      count++;
    }
    return count - 1;
  }

  private sampleNormal(rng: () => number): number {
    const u1 = rng();
    const u2 = rng();
    return (
      Math.sqrt(-2 * Math.log(Math.max(u1, 1e-10))) *
      Math.cos(2 * Math.PI * u2)
    );
  }
}
