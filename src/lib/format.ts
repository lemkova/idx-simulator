export function formatPrice(price: number): string {
  return new Intl.NumberFormat("id-ID").format(price);
}

export function formatVolume(shares: number): string {
  const lots = shares / 500;
  if (lots >= 1000) {
    return `${(lots / 1000).toFixed(1)}K`;
  }
  return lots.toFixed(0);
}

export function formatPercent(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

export function formatSimTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
