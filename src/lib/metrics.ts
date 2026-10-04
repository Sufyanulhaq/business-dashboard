import { addDays } from "./data";
import { COUNTED, STATUSES, type Order, type Query, type Region, type SortKey, type Status } from "./types";

export interface Range {
  from: string;
  to: string;
  days: number;
}

export function rangeFor(to: string, days: number): Range {
  return { from: addDays(to, -(days - 1)), to, days };
}

export function previousRange(r: Range): Range {
  return rangeFor(addDays(r.from, -1), r.days);
}

export const inRange = (orders: Order[], r: Range) => orders.filter((o) => o.date >= r.from && o.date <= r.to);
const counted = (orders: Order[]) => orders.filter((o) => COUNTED.includes(o.status));
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Summary {
  revenue: number;
  orders: number;
  aov: number;
  customers: number;
}

export function summarize(orders: Order[]): Summary {
  const sales = counted(orders);
  const revenue = round2(sales.reduce((s, o) => s + o.total, 0));
  return {
    revenue,
    orders: sales.length,
    aov: sales.length ? round2(revenue / sales.length) : 0,
    customers: new Set(sales.map((o) => o.customer)).size,
  };
}

/** Change from the previous period as a fraction, or null when there is nothing to compare with. */
export function delta(current: number, previous: number): number | null {
  return previous === 0 ? null : (current - previous) / previous;
}

export function revenueByDay(orders: Order[], r: Range): { date: string; revenue: number }[] {
  const sums = new Map<string, number>();
  for (const o of counted(orders)) sums.set(o.date, (sums.get(o.date) ?? 0) + o.total);
  return Array.from({ length: r.days }, (_, i) => {
    const date = addDays(r.from, i);
    return { date, revenue: round2(sums.get(date) ?? 0) };
  });
}

export function topProducts(orders: Order[], n = 5): { product: string; revenue: number; units: number }[] {
  const map = new Map<string, { revenue: number; units: number }>();
  for (const o of counted(orders)) {
    for (const l of o.items) {
      const cur = map.get(l.product) ?? { revenue: 0, units: 0 };
      cur.revenue += l.qty * l.unit;
      cur.units += l.qty;
      map.set(l.product, cur);
    }
  }
  return [...map.entries()]
    .map(([product, v]) => ({ product, revenue: round2(v.revenue), units: v.units }))
    .sort((a, b) => b.revenue - a.revenue || a.product.localeCompare(b.product))
    .slice(0, n);
}

export function byStatus(orders: Order[]): Record<Status, number> {
  const out = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  for (const o of orders) out[o.status] += 1;
  return out;
}

export function revenueByRegion(orders: Order[]): { region: Region; revenue: number }[] {
  const map = new Map<Region, number>();
  for (const o of counted(orders)) map.set(o.region, (map.get(o.region) ?? 0) + o.total);
  return [...map.entries()].map(([region, revenue]) => ({ region, revenue: round2(revenue) })).sort((a, b) => b.revenue - a.revenue);
}

export function filterOrders(orders: Order[], q: Pick<Query, "status" | "region" | "q">): Order[] {
  const needle = q.q.trim().toLowerCase();
  return orders.filter(
    (o) =>
      (q.status === "all" || o.status === q.status) &&
      (q.region === "all" || o.region === q.region) &&
      (!needle || o.id.toLowerCase().includes(needle) || o.customer.toLowerCase().includes(needle)),
  );
}

export function sortOrders(orders: Order[], key: SortKey, dir: "asc" | "desc"): Order[] {
  const sign = dir === "asc" ? 1 : -1;
  return [...orders].sort((a, b) => {
    const primary = key === "total" ? a.total - b.total : key === "customer" ? a.customer.localeCompare(b.customer) : a.date.localeCompare(b.date);
    return sign * primary || a.id.localeCompare(b.id) * sign; // the id keeps the order stable
  });
}

export const PAGE_SIZE = 10;

export function paginate<T>(rows: T[], page: number, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { page: current, pages, total: rows.length, pageSize: size, rows: rows.slice((current - 1) * size, current * size) };
}

/** Quotes a value for CSV, and defuses cells that a spreadsheet would run as a formula. */
export function csvCell(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(orders: Order[]): string {
  const head = ["id", "date", "customer", "region", "channel", "status", "items", "total"];
  const lines = orders.map((o) =>
    [o.id, o.date, o.customer, o.region, o.channel, o.status, o.items.map((i) => `${i.qty}x ${i.product}`).join("; "), o.total.toFixed(2)].map(csvCell).join(","),
  );
  return [head.join(","), ...lines].join("\n") + "\n";
}
