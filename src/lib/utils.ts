let idCounter = 0;

export function generateId(prefix = "id"): string {
  return `${prefix}-${++idCounter}-${Date.now().toString(36)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
