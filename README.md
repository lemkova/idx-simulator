# IDX Sim — Professional Trading Strategy Simulator

A high-fidelity Indonesia Stock Exchange (IDX) trading simulator powered by **Hawkes self-exciting point processes**. Features a professional-grade trading terminal UI with live order book depth, candlestick charts, time & sales tape, and multi-agent market simulation — all built on Next.js 16, React 19, and a pure-TypeScript simulation engine.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React 19)                    │
│                                                              │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │Order Book │  │ Price Chart  │  │   Trade Tape       │    │
│  │(15+15 lvls│  │(TradingView  │  │ (Time & Sales,     │    │
│  │vol bars)  │  │ candlestick) │  │  animated entries) │    │
│  └──────────┘  └──────────────┘  └────────────────────┘    │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │Market Ov.│  │Agent Monitor │  │  Control Panel     │    │
│  │(5 stocks)│  │(Hawkes bar)  │  │ (params + speed)   │    │
│  └──────────┘  └──────────────┘  └────────────────────┘    │
│                                                              │
│            Zustand simStore (vanilla, subscribeWithSelector) │
│                         ▲                                     │
│                 ~12 Hz  │  snapshot callback                  │
├─────────────────────────┼────────────────────────────────────┤
│                         │          Engine (pure TypeScript)   │
│  ┌──────────────────────┴──────────────────────────────────┐ │
│  │                   MarketSimulator                        │ │
│  │  ┌───────────┐  ┌────────────┐  ┌─────────────────┐    │ │
│  │  │  Hawkes   │  │  Random    │  │   Liquidity     │    │ │
│  │  │ Process   │  │  Agents    │  │   Provider      │    │ │
│  │  │ (per stock)│  │   (×20)    │  │   (per stock)   │    │ │
│  │  └─────┬─────┘  └─────┬──────┘  └───────┬─────────┘    │ │
│  │        │              │                  │              │ │
│  │        ▼              ▼                  ▼              │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │               Matching Engine                      │ │ │
│  │  │      (price-time priority, ARB/ARA validation)     │ │ │
│  │  └──────────────────────┬─────────────────────────────┘ │ │
│  │                         ▼                                │ │
│  │  ┌────────────────────────────────────────────────────┐ │ │
│  │  │               Order Book                           │ │ │
│  │  │  Map<Price, Order[]> bids + asks with sorted arrays │ │ │
│  │  └────────────────────────────────────────────────────┘ │ │
│  │                                                          │ │
│  │  ┌───────────┐  ┌────────────┐  ┌─────────────────┐    │ │
│  │  │Tick Rules │  │   PRNG     │  │  Candle Builder │    │ │
│  │  │(IDX regs) │  │(Mulberry32)│  │  (OHLCV 60s)    │    │ │
│  │  └───────────┘  └────────────┘  └─────────────────┘    │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Wall Clock (50ms tick interval)
       │
       ▼
  simDt = wallDt × speedMultiplier
       │
       ▼
  HawkesProcess.tick(simDt, rng)  ──────►  nEvents sampled via Poisson thinning
       │
       ▼
  for each event:
    RandomAgent.generateOrder()  ──────►  market/limit Order
    TickRules.validateOrderPrice()  ───►  ARB/ARA + tick size check
    MatchingEngine.matchOrder()  ──────►  fills, Trade objects, price updates
       │
       ▼
  LiquidityProvider.replenish()  ──────►  cancel old + post 15 bid + 15 ask levels
       │
       ▼  (every 80ms wall-clock)
  OrderBook.getSnapshot()  ──────►  all PriceLevel[] bids + asks (no depth cap)
       │
       ▼
  simStore.applySnapshot(snap)  ──────►  hydrates entire Zustand store
       │
       ▼
  React hooks (useStore selectors)  ───►  targeted re-renders per slice
```

The engine and UI are **fully decoupled**. The simulation runs on `setInterval` timers. The React layer never imports engine code directly — only the Zustand store bridges them. This means the engine could be swapped for a different implementation, or driven by a WebSocket server, without touching any component.

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Framework** | Next.js 16 (App Router) | Server rendering for metadata, client-only for the sim |
| **UI** | React 19 | Concurrent features, granular updates |
| **Language** | TypeScript 6 (strict) | Full type safety across engine and UI |
| **State** | Zustand v5 (`subscribeWithSelector`) | Vanilla stores outside React tree, targeted subscriptions |
| **Styling** | Tailwind CSS v4 (`@theme` tokens) | Utility-first, custom design tokens at build time |
| **Fonts** | Plus Jakarta Sans + JetBrains Mono (next/font/google) | Zero-layout-shift font loading, mono for data |
| **Icons** | Phosphor Icons React | Tree-shakeable, weight variants, professional look |
| **Charts** | lightweight-charts v5 (TradingView) | GPU-accelerated canvas, financial chart primitives |
| **Engine** | Pure TypeScript (zero dependencies) | Runs anywhere — browser, Node, worker thread |

---

## Directory Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind v4 @theme tokens, custom scrollbars,
│   │                          range slider styling, keyframe animations
│   ├── layout.tsx           # Root layout: font loading (next/font/google),
│   │                          metadata, HTML/body setup
│   └── page.tsx             # Entry: dynamic import of AppShell (ssr: false)
│
├── components/
│   ├── AppShell.tsx          # Main 3-column responsive grid + engine bootstrap
│   ├── Header.tsx            # Logo, ticker pills, status bar (clock, events, LIVE)
│   ├── ControlPanel.tsx      # Start/Stop, speed button group, Hawkes sliders, reset
│   ├── charts/
│   │   └── PriceChart.tsx    # lightweight-charts: CandlestickSeries + HistogramSeries
│   ├── order-book/
│   │   ├── OrderBook.tsx     # Container: fixed 3-row grid (1fr_auto_1fr)
│   │   ├── OrderBookRow.tsx  # Price level: price, volume, order count, vol bar
│   │   ├── AskLadder.tsx     # Ask side (bottom-anchored, independent scroll)
│   │   ├── BidLadder.tsx     # Bid side (top-anchored, independent scroll)
│   │   └── SpreadIndicator.tsx  # Mid price + spread (IDR + pct), opaque center bar
│   ├── trades/
│   │   ├── TradeTape.tsx     # Time & Sales tape: gradient fade mask, auto-scroll
│   │   └── TradeRow.tsx      # Animated trade entry (slide-in + green/red flash)
│   ├── dashboard/
│   │   └── MarketOverview.tsx  # 5-stock grid table with caret icons, clickable rows
│   └── agents/
│       └── AgentMonitor.tsx   # Hawkes intensity bar, formula display, stats grid
│
├── engine/
│   ├── index.ts              # Public barrel: re-exports all engine types + functions
│   ├── types.ts              # Every domain type: Order, Trade, Candle, PriceLevel,
│   │                           OrderBookData, StockSimState, SimulationSnapshot, etc.
│   ├── constants.ts          # LOT_SIZE (500), ARB/ARA factors, tick tiers table,
│   │                           timing intervals, buffer limits
│   ├── market-simulator.ts   # Top-level orchestrator: tick loop, snapshot emission,
│   │                           lifecycle (start/stop/reset), speed scaling
│   ├── matching-engine.ts    # Price-time priority crossing: market + limit orders,
│   │                           partial fills, OHLCV updates
│   ├── order-book.ts         # Dual Map<Price, Order[]> with sorted price arrays,
│   │                           binary search insertion, snapshot aggregation
│   ├── hawkes-process.ts     # Self-exciting point process: O(1) recursive intensity,
│   │                           Poisson thinning, Knuth/normal sampling
│   ├── random-agent.ts       # 20 agents across 5 behavioral groups, log-normal
│   │                           size + exponential offset sampling
│   ├── liquidity-provider.ts  # Market maker: 15 levels/side, sub-linear spacing,
│   │                           fair price from order book mid
│   ├── tick-rules.ts         # IDX tick size tiers, ARB/ARA bounds, price validation,
│   │                           tick rounding helpers
│   └── prng.ts               # Mulberry32 seeded PRNG: deterministic, fast, 32-bit
│
├── stores/
│   ├── simulation-store.ts   # Zustand vanilla store: all simulation state + actions
│   │                           (applySnapshot, setRunning, setSpeed, setHawkesParams)
│   └── ui-store.ts           # Zustand vanilla store: theme (dark/light)
│
├── hooks/
│   └── useSimulation.ts      # Granular zustand useStore selectors (one per data slice)
│
└── lib/
    ├── format.ts             # Intl.NumberFormat("id-ID") for prices, lot conversion,
    │                           percent formatting, HH:MM:SS time
    └── utils.ts              # generateId, clamp, deepClone
```

---

## Engine Deep Dive

The engine (`src/engine/`) is a **pure-TypeScript simulation core** with zero framework dependencies. It models a continuous-time point process driving order arrivals into a limit order book with IDX-specific market microstructure rules.

### 1. Market Simulator (`market-simulator.ts`)

The central orchestrator. Runs on two decoupled intervals:

| Timer | Wall-Clock Interval | Purpose |
|-------|---------------------|---------|
| Tick | 50ms | Process Hawkes events, generate agent orders, run matching engine, replenish LP |
| Snapshot | 80ms | Build full `SimulationSnapshot`, push to Zustand store (~12 Hz) |

**Simulation time** = `wallDt × speedMultiplier`. At the default 60× speed, 1 wall-clock second = 60 sim-seconds = 1 sim-minute. The candle interval is fixed at 60 sim-seconds, so at 60×, each wall-clock second produces one new OHLCV candle.

**Lifecycle:**
- `start()` — creates both `setInterval` timers
- `stop()` — clears both timers, preserves state
- `reset()` — stops, reinitializes all per-stock state, recreates Hawkes processes and agent pool
- `setSpeed(n)` / `updateHawkesParams(params)` — hot-swappable at runtime

**Snapshot emission:** Iterates all stocks, calls `getSnapshot()` on each order book, computes spread and mid price, collects recent trades (capped at 100), packages candles + intensities, and invokes the callback registered by the UI layer.

### 2. Hawkes Process (`hawkes-process.ts`)

A **self-exciting point process** — the core mathematical model driving order arrivals. Unlike a homogeneous Poisson process (constant rate), the Hawkes process's intensity λ(t) spikes after each event and then decays back toward baseline, creating realistic **volatility clustering**.

**Mathematical formulation:**

```
Between events:   λ(t) = μ + (λ₀ − μ) · e^(−β · Δt)
On each event:    λ(t) ← λ(t) + α · β
```

Where:
- **μ** (mu) — baseline intensity (events per sim-second in the absence of excitation)
- **α** (alpha) — excitation factor; each event adds `α·β` to the intensity
- **β** (beta) — exponential decay rate; higher β = faster reversion to baseline
- **λ₀** — the intensity value at the start of the current interval

**Why this matters:**
- A large market order can trigger a cascade of follow-up orders (momentum ignition)
- α close to 0.9 can create **near-critical regimes** where activity sustains itself for extended periods
- High β paired with high α produces short, intense bursts (HFT-like behavior)
- Low β produces slow-burn activity waves (institutional execution schedules)

**Implementation detail — O(1) recursion:** The formula avoids iterating over all past events by maintaining only the current intensity value. Between events, the decay is exact (no Euler approximation). On events, the jump is instantaneous. This is mathematically exact for the exponential kernel.

**Event sampling:** Uses **Knuth's algorithm** (exact Poisson sampling via product of uniforms) for λ ≤ 30, and **normal approximation** (N(λ, λ)) for λ > 30 for performance.

### 3. Random Agents (`random-agent.ts`)

20 heterogeneous agents organized into **5 behavioral groups**, each with distinct trading fingerprints:

| Group | Count | Market Order% | Limit Offset (ticks) | Avg Size (lots) | Cancel% | Archetype |
|-------|-------|---------------|----------------------|-----------------|---------|-----------|
| 0 | 8 | 10% | 5 | 1.5 | 10% | **Passive retail** — mostly limit orders, wider offsets, small size |
| 1 | 4 | 50% | 2 | 3 | 2% | **Aggressive trader** — half market orders, tight offsets, rarely cancels |
| 2 | 3 | 5% | 8 | 10 | 5% | **Patient institutional** — almost all limit orders, far from mid, large size |
| 3 | 3 | 60% | 1 | 2 | 20% | **High-frequency scalper** — mostly market orders, ticks away from best, cancels often |
| 4 | 2 | 20% | 3 | 5 | 15% | **Balanced mid-size** — moderate everything |

**Order generation process** (per agent, per event):

1. **Side**: Random coin flip (50% buy / 50% sell)
2. **Type**: Bernoulli trial against `marketOrderProb` → market or limit
3. **Size**: Sampled from **log-normal distribution** — `exp(N(μ_size, σ_size))` in lots, converted to shares via `LOT_SIZE` (×500). This creates a realistic right-skewed size distribution (many small orders, few large ones)
4. **Limit price offset**: Sampled from **exponential distribution** — `Exp(1/meanTicks)` in tick units, snapped to IDX tick size. Added to best bid (for buys) or subtracted from best ask (for sells)
5. **Price validation**: Clamped to ARB/ARA bounds, validated against tick size multiples

**Why log-normal for size?** Real order size distributions are heavily right-skewed — the median order might be 1 lot, but 10,000-lot orders do happen. Log-normal captures this naturally.

**Why exponential for offset?** Most limit orders are placed near the best price, with a rapidly decreasing probability of far-from-market orders. Exponential decay models this parsimoniously.

### 4. Liquidity Provider (`liquidity-provider.ts`)

A dedicated market-making agent that guarantees the book always has visible depth. Runs **every tick regardless of Hawkes events**.

**Algorithm:**

1. **Cancel**: Remove all previous LP orders from both sides of the book
2. **Fair price**: Compute the order book mid price — `round((bestBid + bestAsk) / 2 / tickSize) × tickSize`. Falls back to `lastPrice` or `referencePrice` if the book is empty
3. **Post asks**: Place 15 limit sell orders at prices `fairPrice + tickSize × round((i+1)^1.6)` for i = 0..14
4. **Post bids**: Place 15 limit buy orders at prices `fairPrice − tickSize × round((i+1)^1.6)` for i = 0..14

**Sub-linear level spacing** — `(i+1)^1.6`:

```
Level  1:   1 tick   from mid    (tight)
Level  2:   3 ticks
Level  3:   6 ticks
Level  4:   9 ticks
Level  5:  13 ticks
Level  6:  18 ticks
Level  7:  22 ticks
Level  8:  28 ticks
Level  9:  34 ticks
Level 10:  40 ticks
Level 11:  46 ticks
Level 12:  53 ticks
Level 13:  61 ticks
Level 14:  68 ticks
Level 15:  76 ticks             (wide)
```

This concentrates liquidity near the mid price — exactly where real market makers operate. The first 5 levels are within 13 ticks, while the outer levels stretch to absorb large sweeps. Compared to linear spacing (1, 2, 3, ..., 15 ticks), this provides 3× more liquidity within 5 ticks of mid.

**Default config:** 15 levels, 15 lots per level = 225 lots (112,500 shares) of resting liquidity per side.

### 5. Matching Engine (`matching-engine.ts`)

**Price-time priority** crossing engine:

**For market orders** (price = 0 at submission):
- Walk the opposite book from best price outward
- Fill at whatever price the resting orders sit at
- Fill until the order is complete or the book is exhausted

**For limit orders:**
- **Buy limit**: Only crosses if `limitPrice ≥ bestAsk`. Walk asks ascending, fill at resting ask prices. Any unfilled quantity rests on the bid book at `limitPrice`
- **Sell limit**: Only crosses if `limitPrice ≤ bestBid`. Walk bids descending, fill at resting bid prices. Any unfilled quantity rests on the ask book at `limitPrice`

**On each fill:**
- Updates `lastPrice`
- Updates `dayHigh` / `dayLow`
- Adds filled quantity × price to `cumulativeVolume`
- Updates the current candle: open (first trade in window), high, low, close, volume + trade count
- Creates a `Trade` object with buyer/seller agent IDs and order IDs

### 6. Order Book (`order-book.ts`)

Dual `Map<Price, Order[]>` structure with companion sorted price arrays:

```
OrderBookData {
  bids: Map<Price, Order[]>     // keyed by price, descending order
  asks: Map<Price, Order[]>     // keyed by price, ascending order
  bidPrices: Price[]             // sorted descending for fast iteration
  askPrices: Price[]             // sorted ascending for fast iteration
}
```

- **Insertion**: Price level lookup is O(1) via Map. New price levels use binary search insertion into the sorted array — O(log n)
- **Removal**: O(1) Map delete + binary search splice — O(log n)
- **Best price**: `bidPrices[0]` and `askPrices[0]` — O(1)
- **Iteration**: Walk sorted arrays in price priority order — O(levels)
- `getSnapshot()` aggregates each level into `PriceLevel { price, totalQuantity, orderCount }` with no depth cap

### 7. Tick Rules (`tick-rules.ts`)

Implements real **Indonesia Stock Exchange (IDX)** regulations:

**Tick size tiers** (price-dependent minimum increment):

| Price Range (IDR) | Tick Size | Max Step Change |
|-------------------|-----------|-----------------|
| ≤ 200 | 1 | 10 |
| 201 – 500 | 2 | 20 |
| 501 – 2,000 | 5 | 50 |
| 2,001 – 5,000 | 10 | 100 |
| > 5,000 | 25 | 250 |

**Daily price limits:**
- **ARB** (Auto Reject Bid): `referencePrice × 0.90` — orders cannot be placed at or below this
- **ARA** (Auto Reject Ask): `referencePrice × 1.25` — orders cannot be placed at or above this
- Reference price updates every 600 sim-seconds

**Validation**: Every limit order price must be (a) a multiple of the applicable tick size, and (b) within [ARB, ARA]. Invalid prices are rejected before reaching the matching engine.

### 8. Seeded PRNG (`prng.ts`)

**Mulberry32** — a fast, deterministic 32-bit PRNG:

```typescript
function mulberry32(seed: number): () => number {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}
```

**All randomness** — Hawkes event counts, agent order generation, size/offset sampling — flows through this single deterministic source. Same seed → identical simulation replay.

---

## State Management

### Store Architecture

Two **Zustand vanilla stores** (created with `createStore`, not tied to React):

**`simStore`** (`simulation-store.ts`) — the central data hub:

| Category | Fields | Update Rate |
|----------|--------|-------------|
| Control | `isRunning`, `speedMultiplier`, `hawkesParams` | User-driven |
| Time | `elapsedSimTime`, `totalEvents` | ~12 Hz |
| Selection | `selectedStockId`, `stockConfigs` | User-driven |
| Market Data | `stockSummaries`, `orderBookSnapshot`, `candles`, `currentCandle`, `recentTrades`, `hawkesIntensity` | ~12 Hz |

Key actions:
- `applySnapshot(snap: SimulationSnapshot)` — called by engine at ~12 Hz; hydrates all market data fields for the selected stock
- `setSelectedStock(id)` — switches the active view; triggers re-render of order book, chart, trade tape
- `setRunning(bool)`, `setSpeed(n)`, `setHawkesParams(params)` — relayed back to engine via subscriptions

**`uiStore`** (`ui-store.ts`) — minimal:
- `theme: "dark" | "light"` (default `"dark"`)
- `setTheme(theme)`

### Selector Pattern

Each data slice has its own hook in `useSimulation.ts` using Zustand's `useStore` with a selector function:

```typescript
export function useOrderBook() {
  return useStore(simStore, (s) => s.orderBookSnapshot);
}
```

This means a component using `useOrderBook()` will **not re-render** when `elapsedSimTime` or `totalEvents` changes — only when the order book snapshot changes. The `subscribeWithSelector` middleware enables this targeted subscription pattern.

---

## Frontend Design System

### Color Palette (Tailwind v4 `@theme` tokens)

| Token | Value | Usage |
|-------|-------|-------|
| `term-base` | `#0a0e14` | Page background, deepest layer |
| `term-panel` | `#131a24` | Panel/card backgrounds |
| `term-border` | `#1a2435` | Borders, dividers, grid lines |
| `buy` | `#10b981` (emerald) | Bid prices, price up, active state, buy tape entries |
| `buy-dim` | `rgba(16,185,129,0.15)` | Volume bars (bid side), subdued buy indicators |
| `sell` | `#f43f5e` (rose) | Ask prices, price down, stop button, sell tape entries |
| `sell-dim` | `rgba(244,63,94,0.15)` | Volume bars (ask side), subdued sell indicators |
| `accent` | `#f59e0b` (amber) | Headers, highlights, selected state, formula, sliders |
| `accent-dim` | `rgba(245,158,11,0.15)` | Selected row background |

### Typography

- **Labels & UI text**: Plus Jakarta Sans (sans-serif) — loaded via `next/font/google` with CSS variable `--font-sans`
- **Numeric data**: JetBrains Mono (monospace) — loaded via `next/font/google` with CSS variable `--font-mono`
- Both fonts are self-hosted at build time (no runtime Google Fonts requests)

### Custom CSS

- **Scrollbars**: 4px thin, term-base track, term-border thumb, hover highlight
- **Range sliders**: Amber thumb with outer glow, term-border track, small pill shape
- **Animations**: `flashUp` (green), `flashDown` (red), `slideInRight` (trade entry), `pulse-fast` (live indicator)
- **Utilities**: `.panel` (inset highlight), `.data-row` (hover transition), `.no-scrollbar` (hidden scrollbar for tape)

### Responsive Grid

The AppShell uses a responsive 3-column CSS grid:

```
< 1024px:        single column (stacked)
1024–1279px:     2 columns  [340px orderbook | chart + overview + right panels stacked]
≥ 1280px:        3 columns  [360px orderbook | chart + overview | 320px trade tape + agent]
```

---

## Stocks Modeled

| Ticker | Company | IPO Price (IDR) | Tick Size |
|--------|---------|------------------|-----------|
| BBCA | Bank Central Asia | 1,250 | 5 |
| BBRI | Bank Rakyat Indonesia | 800 | 5 |
| TLKM | Telkom Indonesia | 420 | 2 |
| ASII | Astra International | 3,200 | 10 |
| UNVR | Unilever Indonesia | 6,800 | 25 |

These span four of the five IDX tick-size tiers, exercising the full tick rule table. UNVR at 6,800 uses the largest tick size (25), while TLKM at 420 uses the smallest (2).

---

## AI-Assisted Development Methodology

This project was designed and built using **Claude Code** with multiple specialized skills and MCP servers. Below is a detailed account of which tools were used, when, and why.

### Phase 1: Design Generation

**Skill: AIDesigner (aidesigner MCP server)**

The visual redesign was initiated by generating a professional trading terminal design through AIDesigner:

1. **`create_editor_session`** — Created a live AIDesigner editor project linked to this coding agent. All generated designs stream directly to the editor canvas for visual review.

2. **`generate_design`** — Generated the complete trading terminal HTML/CSS with a detailed prompt specifying:
   - Exact 3-column grid layout (360px order book, flexible chart, 320px sidebar)
   - Color palette (deeper dark theme than the original slate-900)
   - Typography (JetBrains Mono for data, Plus Jakarta Sans for labels)
   - All 7 component zones (header, order book, chart, market overview, trade tape, agent monitor, control panel)
   - Interactive states (pill tabs, hover rows, pulsing indicators, animated tape entries)
   - `repo_context` provided the existing tech stack for compatibility

3. **`get_canvas`** — Retrieved the full generated HTML for analysis and adoption.

**Result**: A complete visual reference with semantic color tokens (`term-base`, `term-panel`, `buy`/`sell`/`accent`), CSS grid layouts, component structure, and animation definitions.

### Phase 2: Implementation

**Skill: Claude Code (interactive agent)**

The generated design was systematically adopted into the existing Next.js codebase:

1. **Foundation** — Updated `globals.css` with Tailwind v4 `@theme` tokens matching the generated design's color palette. Added custom scrollbar, range slider, and keyframe animation CSS. Updated `layout.tsx` with `next/font/google` for JetBrains Mono and Plus Jakarta Sans.

2. **Components** — Rewrote all 11 React components (Header, ControlPanel, AppShell, OrderBook, OrderBookRow, AskLadder, BidLadder, SpreadIndicator, PriceChart, TradeTape, TradeRow, MarketOverview, AgentMonitor) to match the design while preserving:
   - All Zustand store subscriptions and selectors
   - Engine callback wiring (start/stop, speed, Hawkes params)
   - lightweight-charts integration (chart instance lifecycle, resize handling)
   - Memoization (`React.memo`) on row components

3. **Icons** — Replaced text-based indicators with Phosphor Icons (`TrendUp`, `BookOpen`, `Play`/`Stop`, `CaretUp`/`CaretDown`, `Minus`, `Cpu`, `ArrowCounterClockwise`, `ListDashes`)

4. **Layout** — Changed from `grid-cols-[1fr_340px]` (2 columns) to responsive 3-column `grid-cols-[360px_1fr_320px]` at ≥1280px, with the right sidebar (`TradeTape` + `AgentMonitor`) hidden below that breakpoint.

### Phase 3: Verification

**MCP Server: Playwright**

The running application was tested in a real Chromium browser:

1. **`browser_navigate`** — Loaded `http://0.0.0.0:3000` to verify page title, console errors, and initial render
2. **`browser_snapshot`** — Captured accessibility tree snapshots to verify DOM structure, component hierarchy, and data binding
3. **`browser_click` / `browser_run_code`** — Interacted with Start button, stock ticker pills, verified simulation state transitions
4. **`browser_evaluate`** — Ran DOM queries to count order book rows, verify spread indicator centering, and check LP level count
5. **`browser_console_messages`** — Injected `console.warn` debug logs to trace `levels=15` through the LP replenish path
6. **`browser_take_screenshot`** — Captured full-page screenshots at 1440×900 for visual verification

### Phase 4: Debugging & Refinement

**Issue 1 — Order book still showing 7 levels after code change:**
- Root cause trail: UI level count → snapshot → `getSnapshot(book, 7)` hardcoded depth → `market-simulator.ts` passed `7` → `LiquidityProvider({ levels: 7 })` in two places
- Fix spread across 3 files: LP default (7→15), simulator constructor + reset (removed explicit override), snapshot function (removed `depth` parameter, removed `.slice(0, depth)`)

**Issue 2 — Spread indicator pushed off-screen:**
- Root cause: Asymmetric ask/bid counts in a `flex flex-col` layout where each side had `flex-1`. More asks than bids pushed the spread downward
- Fix: Changed to `grid grid-rows-[1fr_auto_1fr]` with independent `overflow-y-auto` scroll containers in each half. The spread row is fixed at `auto` height between the two `1fr` halves

**Issue 3 — HMR WebSocket failures on external IP:**
- Root cause: Browser accessing dev server through cloud IP (43.129.38.24) while Next.js HMR WebSocket expected localhost
- Fix: Added `allowedDevOrigins: ["43.129.38.24"]` to `next.config.ts`

### Tools Summary

| Tool / Skill | Phase | What It Did |
|-------------|-------|-------------|
| **AIDesigner** (MCP) | Design | Generated complete trading terminal HTML/CSS from detailed prompt, provided visual reference for color tokens, layout, typography |
| **Claude Code** (agent) | Implementation | Read entire codebase, planned changes, rewrote 17 files across engine + UI layers |
| **Playwright** (MCP) | Verification | Browser-based testing: DOM inspection, interaction testing, console monitoring, screenshots |
| **Explore Agent** | Analysis | Pre-implementation codebase exploration; pre-README architecture survey |
| **Context7** (MCP) | Reference | Documentation lookup for Tailwind v4 `@theme`, Next.js `allowedDevOrigins`, next/font API |
| **Git** | Version control | Two focused commits: UI redesign (9f798a4), depth limits + spread fix (a8bf354) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
npm install
npm run dev        # Dev server on http://localhost:3000 (binds 0.0.0.0)
npm run build      # Production build
npm run start      # Production server
```

### Usage

1. Click **Start** to launch the simulation
2. Select a stock ticker pill (BBCA, BBRI, TLKM, ASII, UNVR) to view its order book and chart
3. Adjust **μ** (baseline rate), **α** (excitation), and **β** (decay) to change market dynamics
4. Change **speed** (1× to 300×) to accelerate/decelerate simulation time
5. Click **Stop** to pause; **Reset** to reinitialize

### Controls Reference

| Control | Parameter | Range | Effect |
|---------|-----------|-------|--------|
| μ slider | mu | 0.1 – 2.0 | Baseline order arrival rate (events/sec) |
| α slider | alpha | 0.05 – 0.9 | Excitation strength per event |
| β slider | beta | 0.5 – 5.0 | Decay rate back to baseline |
| Speed buttons | speedMultiplier | 1 – 300 | Wall-clock to sim-time ratio |
| Start/Stop | isRunning | toggle | Run or pause the simulation |
| Reset | — | — | Clear all state, restart from IPO prices |
