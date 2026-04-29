# IDX Sim — Professional Trading Simulator

A real-time Indonesia Stock Exchange (IDX) trading simulator powered by **Hawkes self-exciting point processes**. Features a professional-grade trading terminal UI with live order book depth, candlestick charts, trade tape, and multi-agent market simulation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Order Book   │  │  Price Chart │  │  Trade Tape      │  │
│  │  (Ask/Bid     │  │  (TradingView│  │  (Time & Sales)  │  │
│  │   Ladder)     │  │   Candles)   │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │Market Overview│  │Agent Monitor │  │  Control Panel   │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│              Zustand Store (simStore + uiStore)              │
│                       ▲                                     │
│               ~12 Hz  │  snapshot callback                   │
├───────────────────────┼─────────────────────────────────────┤
│                       │               Engine (pure TS)       │
│  ┌────────────────────┴──────────────────────────────────┐  │
│  │                  MarketSimulator                       │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────────┐   │  │
│  │  │  Hawkes  │  │  Random   │  │   Liquidity      │   │  │
│  │  │ Process  │  │  Agents   │  │   Provider       │   │  │
│  │  │ (1/stock)│  │   (x20)   │  │   (1/stock)      │   │  │
│  │  └──────────┘  └───────────┘  └──────────────────┘   │  │
│  │         │             │                  │            │  │
│  │         ▼             ▼                  ▼            │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Matching Engine                     │  │  │
│  │  │         (price-time priority crossing)           │  │  │
│  │  └────────────────────┬────────────────────────────┘  │  │
│  │                       ▼                               │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │              Order Book                          │  │  │
│  │  │    (Map<Price, Order[]> bid + ask sides)         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────────────┐   │  │
│  │  │ Tick     │  │   PRNG    │  │   Candle         │   │  │
│  │  │ Rules    │  │ (Mulberry)│  │   Builder        │   │  │
│  │  └──────────┘  └───────────┘  └──────────────────┘   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Wall Clock (50ms ticks)
       │
       ▼
simDt = wallDt × speedMultiplier
       │
       ▼
HawkesProcess.tick(simDt, rng)  ──►  event count per stock
       │
       ▼
RandomAgent.generateOrder()  ──►  market/limit orders
LiquidityProvider.replenish()  ──►  15 ask + 15 bid levels
       │
       ▼
MatchingEngine.matchOrder()  ──►  trades, price updates, OHLCV
       │
       ▼
OrderBook.getSnapshot()  ──►  PriceLevel[] bids + asks
       │
       ▼  (every 80ms)
Zustand simStore.applySnapshot()
       │
       ▼
React components re-render (selective via zustand selectors)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | Server + client rendering |
| **UI** | React 19 | Component model |
| **Language** | TypeScript 6 (strict) | Type safety |
| **State** | Zustand v5 (`subscribeWithSelector`) | Central simulation state |
| **Styling** | Tailwind CSS v4 (`@theme` tokens) | Design system |
| **Fonts** | Plus Jakarta Sans + JetBrains Mono (next/font) | Typography |
| **Icons** | Phosphor Icons React | Iconography |
| **Charts** | lightweight-charts v5 (TradingView) | Candlestick + volume |
| **Engine** | Pure TypeScript (zero deps) | Simulation core |

---

## Directory Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind v4 @theme, animations, utilities
│   ├── layout.tsx           # Root layout, font loading, metadata
│   └── page.tsx             # Entry point (dynamic import, no SSR)
│
├── components/
│   ├── AppShell.tsx          # Main layout grid + simulation bootstrap
│   ├── Header.tsx            # Branding, stock selector, status bar
│   ├── ControlPanel.tsx      # Start/Stop, speed, Hawkes sliders
│   ├── charts/
│   │   └── PriceChart.tsx    # lightweight-charts candlestick + volume
│   ├── order-book/
│   │   ├── OrderBook.tsx     # Container: asks + spread + bids (3-row grid)
│   │   ├── OrderBookRow.tsx  # Single price level with volume bar
│   │   ├── AskLadder.tsx     # Ask side (anchored to bottom)
│   │   ├── BidLadder.tsx     # Bid side (anchored to top)
│   │   └── SpreadIndicator.tsx  # Mid price + spread display
│   ├── trades/
│   │   ├── TradeTape.tsx     # Time & Sales tape (scrollable)
│   │   └── TradeRow.tsx      # Single trade entry (animated)
│   ├── dashboard/
│   │   └── MarketOverview.tsx  # All-stock summary table
│   └── agents/
│       └── AgentMonitor.tsx   # Hawkes intensity bar + stats
│
├── engine/
│   ├── types.ts              # All domain types (Order, Trade, Candle, etc.)
│   ├── constants.ts          # LOT_SIZE, ARB/ARA limits, tick tiers
│   ├── market-simulator.ts   # Main orchestrator (tick loop, snapshots)
│   ├── matching-engine.ts    # Order crossing logic
│   ├── order-book.ts         # Map-based limit order book
│   ├── hawkes-process.ts     # Self-exciting point process
│   ├── random-agent.ts       # 20 agents in 5 behavioral groups
│   ├── liquidity-provider.ts  # Market maker (15 levels/side)
│   ├── tick-rules.ts         # IDX tick size + price validation
│   ├── prng.ts               # Seeded PRNG (Mulberry32)
│   └── index.ts              # Public barrel exports
│
├── stores/
│   ├── simulation-store.ts   # Zustand: all simulation state + actions
│   └── ui-store.ts           # Zustand: theme preference
│
├── hooks/
│   └── useSimulation.ts      # Granular zustand selectors per data slice
│
└── lib/
    ├── format.ts             # Number/price/volume/time formatters (id-ID)
    └── utils.ts              # generateId, clamp, deepClone
```

---

## Engine Deep Dive

### 1. Market Simulator (`market-simulator.ts`)

The central orchestrator. Runs two decoupled timers:

| Timer | Frequency | Purpose |
|-------|-----------|---------|
| Tick | 50ms wall-clock | Process Hawkes events, generate orders, match |
| Snapshot | 80ms wall-clock | Push state to Zustand store (~12 Hz) |

**Simulation time** = `wallDt × speedMultiplier`. At 60x, 1 wall second = 60 sim seconds = 1 sim minute. The candle interval is fixed at 60 sim-seconds, so at 60x each wall second produces a new candle.

### 2. Hawkes Process (`hawkes-process.ts`)

A **self-exciting point process** that models clustered order arrivals. The intensity λ(t) evolves as:

```
λ(t) = μ + (λ_prev - μ) × e^(-β × Δt)      ← between events
λ(t) = λ(t) + α × β                          ← on each event (excitation jump)
```

| Parameter | Role | Default | Range |
|-----------|------|---------|-------|
| **μ** (mu) | Baseline arrival rate | 0.5 | 0.1–2.0 |
| **α** (alpha) | Excitation strength per event | 0.3 | 0.1–0.9 |
| **β** (beta) | Decay rate (how fast intensity fades) | 2.0 | 0.5–5.0 |

The O(1) recursive update avoids iterating over all past events, making it suitable for real-time use. Event counts are sampled via **Knuth's algorithm** (exact Poisson for λ ≤ 30) or **normal approximation** (for λ > 30).

### 3. Random Agents (`random-agent.ts`)

20 agents across 5 behavioral archetypes, each with different trading tendencies:

| Group | Count | Market% | Offset (ticks) | Avg Size (lots) | Cancel% | Character |
|-------|-------|---------|----------------|-----------------|---------|-----------|
| 0 | 8 | 10% | 5 | 1.5 | 10% | Passive retail |
| 1 | 4 | 50% | 2 | 3 | 2% | Aggressive trader |
| 2 | 3 | 5% | 8 | 10 | 5% | Large institutional |
| 3 | 3 | 60% | 1 | 2 | 20% | High-frequency |
| 4 | 2 | 20% | 3 | 5 | 15% | Balanced |

Order size is sampled from a **log-normal distribution** (in lots, then converted to shares ×500). Limit price offset from best bid/ask is sampled from an **exponential distribution**, rounded to IDX tick size.

### 4. Liquidity Provider (`liquidity-provider.ts`)

A market-making agent that ensures visible depth at all times. Every tick it:

1. Cancels all previous LP orders on the book
2. Calculates fair price (mid price from order book if available)
3. Posts 15 bid levels below fair + 15 ask levels above fair

Level spacing uses a **sub-linear skew** — `offset = tickSize × (i + 1)^1.6` — clustering more levels near the mid price:

```
Level  1:   1 tick  from mid
Level  2:   3 ticks
Level  3:   6 ticks
Level  4:   9 ticks
Level  5:  13 ticks
...
Level 15:  76 ticks
```

Default: 15 lots per level (7,500 shares per price point).

### 5. Matching Engine (`matching-engine.ts`)

Price-time priority crossing engine:
- **Market orders**: cross immediately at best available price on the opposite side
- **Limit orders**: rest on the book if price isn't aggressive enough; cross only when buy price ≥ best ask or sell price ≤ best bid
- Produces `Trade` objects with buyer/seller metadata
- Updates `lastPrice`, `dayHigh`, `dayLow`, `cumulativeVolume`, and current candle OHLCV

### 6. Order Book (`order-book.ts`)

Dual `Map<Price, Order[]>` structure with sorted price arrays:

- **bids**: sorted descending (highest bid first)
- **askPrices**: sorted ascending (lowest ask first)
- Binary search insertion maintains price order
- `getSnapshot()` aggregates each level into `{price, totalQuantity, orderCount}`

### 7. Tick Rules (`tick-rules.ts`)

Real IDX tick size regime:

| Price Range | Tick Size | Max Step Change |
|-------------|-----------|-----------------|
| ≤ 200 | 1 | 10 |
| 201–500 | 2 | 20 |
| 501–2,000 | 5 | 50 |
| 2,001–5,000 | 10 | 100 |
| > 5,000 | 25 | 250 |

Plus **ARB** (Auto Reject Bid: −10% from reference) and **ARA** (Auto Reject Ask: +25% from reference) bounds.

### 8. PRNG (`prng.ts`)

**Mulberry32** — a fast, seeded 32-bit PRNG. All randomness in the simulation (Hawkes events, agent orders, prices, sizes) flows through this single deterministic source, making simulations reproducible from a seed.

---

## Frontend Architecture

### State Management

Two Zustand vanilla stores (not React Context):

**`simStore`** — all simulation data, updated at ~12 Hz via `applySnapshot()`. Uses `subscribeWithSelector` middleware for targeted subscriptions (components only re-render when their specific slice changes).

**`uiStore`** — theme preference (`dark` / `light`).

### Component Tree

```
AppShell
├── Header
│   └── ControlPanel (Hawkes sliders, speed, start/stop, reset)
├── OrderBook (360px left sidebar)
│   ├── AskLadder (scrollable, bottom-anchored)
│   │   └── OrderBookRow × N (memo'd, volume bars)
│   ├── SpreadIndicator (fixed center, opaque background)
│   └── BidLadder (scrollable, top-anchored)
│       └── OrderBookRow × N
├── [Center Column]
│   ├── PriceChart (lightweight-charts: candlestick + volume)
│   └── MarketOverview (5-stock grid table, clickable rows)
└── [Right Sidebar] (320px, hidden below xl breakpoint)
    ├── TradeTape (animated trade feed, auto-scrolling)
    │   └── TradeRow × N (green/red flash + slide-in animation)
    └── AgentMonitor (Hawkes intensity bar, formula, stats)
```

### Responsive Grid

```
Mobile (<1024px):   single column
Tablet (1024px):    2 columns [340px_orderbook | chart+overview]
Desktop (≥1280px):  3 columns [360px | chart+overview | 320px]
```

### Design System

Uses Tailwind CSS v4 `@theme` directive for semantic color tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `term-base` | `#0a0e14` | Page background |
| `term-panel` | `#131a24` | Panel/card background |
| `term-border` | `#1a2435` | Borders, dividers |
| `buy` | `#10b981` (emerald) | Bid prices, up indicators |
| `sell` | `#f43f5e` (rose) | Ask prices, down indicators |
| `accent` | `#f59e0b` (amber) | Headers, highlights |

Custom CSS animations: `flashUp`/`flashDown` (trade entry flash), `slideInRight` (tape row entry), `pulse-fast` (live indicator). Custom scrollbar and range slider styling via browser pseudo-elements.

---

## AI Methodology

This project was designed and built using **Claude Code** with the following AI-assisted workflows:

### Design Phase

- **AIDesigner** (`aidesigner` MCP server + skill): Generated the professional trading terminal visual design using `generate_design` with a detailed prompt describing the 3-column grid layout, color palette, component structure, and interactive behavior. The generated HTML served as a visual reference for the color tokens (term-base, term-panel, buy/sell/accent), font choices (Plus Jakarta Sans + JetBrains Mono), iconography (Phosphor Icons), and layout patterns (pill-shaped ticker tabs, grouped Hawkes params, gradient intensity bars, vol-bar proportions).

### Implementation Phase

- **Claude Code** interactive agent: Read the existing codebase, planned changes, and executed a systematic redesign across 17 files — from `globals.css` theme tokens up through every component.
- **Context7** (`plugin:context7` MCP server): Fetched current Tailwind CSS v4 and Next.js documentation when needed for `@theme` syntax, `allowedDevOrigins`, and `next/font` configuration.
- **Playwright** (`plugin:playwright` MCP server): Verified the UI in a real browser — started the dev server, loaded the page, clicked Start, switched stocks, inspected the DOM, and counted order book rows to confirm engine changes took effect.

### Refinement Phase

- Iterative debugging: Traced the 7-level cap through three layers (LP default → simulator hardcode → snapshot truncation), using `console.warn` injection and DOM inspection to isolate each issue.
- The spread indicator positioning was refined from `relative flex` (content-dependent) to `grid-rows-[1fr_auto_1fr]` (fixed proportions) after observing that asymmetric ask/bid counts pushed the spread off-screen.

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens on `http://localhost:3000`. The dev server binds to `0.0.0.0` for external access.

### Production Build

```bash
npm run build
npm start
```

### Usage

1. Click **Start** to begin the simulation
2. Select a stock ticker (BBCA, BBRI, TLKM, ASII, UNVR) to view its order book and chart
3. Adjust **Hawkes parameters** (mu, alpha, beta) to change order arrival dynamics
4. Change **speed multiplier** (1x to 300x) to accelerate simulation time
5. Click **Stop** to pause; **Reset** to reinitialize

### Controls

| Control | Effect |
|---------|--------|
| μ (mu) slider | Baseline order arrival rate |
| α (alpha) slider | Self-excitation strength per event |
| β (beta) slider | Excitation decay speed |
| Speed 1x–300x | Wall-clock to sim-time multiplier |
| Start/Stop | Run/pause simulation |
| Reset | Clear all state and restart |

---

## IDX Market Rules Implemented

- **Lot size**: 500 shares per lot
- **Tick size tiers**: 5 tiers based on price range (IDX standard)
- **ARB** (Auto Reject Bid): −10% from reference price
- **ARA** (Auto Reject Ask): +25% from reference price
- **Reference price**: Updated every 600 sim-seconds (10 sim-minutes)
- **Price validation**: Must be multiple of tick size and within ARB/ARA bounds

## Stocks Simulated

| Ticker | Company | IPO Price (IDR) |
|--------|---------|------------------|
| BBCA | Bank Central Asia | 1,250 |
| BBRI | Bank Rakyat Indonesia | 800 |
| TLKM | Telkom Indonesia | 420 |
| ASII | Astra International | 3,200 |
| UNVR | Unilever Indonesia | 6,800 |
