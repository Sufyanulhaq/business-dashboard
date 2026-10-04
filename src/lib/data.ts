import { CHANNELS, REGIONS, type Channel, type Item, type Order, type Region, type Status } from "./types";

/** The demo "today". Fixed so the data and the screenshots never change. */
export const AS_OF = "2026-10-03";
export const DAYS_OF_HISTORY = 210;

export const PRODUCTS = [
  { name: "Standing desk 120cm", price: 349, weight: 5, maxQty: 1 },
  { name: "Standing desk 160cm", price: 429, weight: 3, maxQty: 1 },
  { name: "Ergonomic chair", price: 219, weight: 4, maxQty: 2 },
  { name: "Monitor arm", price: 59, weight: 6, maxQty: 2 },
  { name: "Desk mat", price: 29, weight: 7, maxQty: 3 },
  { name: "Cable tray", price: 24, weight: 5, maxQty: 2 },
  { name: "Laptop stand", price: 45, weight: 5, maxQty: 2 },
  { name: "Footrest", price: 35, weight: 3, maxQty: 2 },
];

const FIRST = ["Amelia", "Noah", "Priya", "Tom", "Hannah", "Marcus", "Olivia", "Liam", "Mei", "Sam", "Isla", "Arjun", "Grace", "Daniel", "Zara", "Callum", "Freya", "Omar", "Ruth", "Ben"];
const LAST = ["Nair", "Becker", "Cole", "Webb", "Grant", "Holt", "Lin", "Okafor", "Reyes", "Patel", "Walker", "Hughes", "Morgan", "Ahmed", "Fraser", "Evans", "Bell", "Shaw", "Dunn", "Hart"];

/** A small seeded random number generator, so the same seed always gives the same orders. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)];
}

function pickWeighted<T extends { weight: number }>(rand: () => number, list: readonly T[]): T {
  const total = list.reduce((s, x) => s + x.weight, 0);
  let r = rand() * total;
  for (const x of list) {
    r -= x.weight;
    if (r <= 0) return x;
  }
  return list[list.length - 1];
}

export function buildOrders(seed = 42, days = DAYS_OF_HISTORY, asOf = AS_OF): Order[] {
  const rand = mulberry32(seed);
  const customers = Array.from({ length: 70 }, () => `${pick(rand, FIRST)} ${pick(rand, LAST)}`);
  const orders: Order[] = [];
  let n = 1000;
  for (let back = days - 1; back >= 0; back--) {
    const date = addDays(asOf, -back);
    const dow = new Date(`${date}T00:00:00Z`).getUTCDay();
    const weekday = dow === 0 || dow === 6 ? 0.6 : 1.1;
    const growth = 1 + ((days - back) / days) * 0.45; // sales slowly climb over the months
    const promo = date === addDays(asOf, -37) ? 2.4 : 1; // one sale day
    const count = Math.max(0, Math.round((3.6 + rand() * 4.2) * weekday * growth * promo));
    for (let i = 0; i < count; i++) {
      const lines = 1 + Math.floor(rand() * 3);
      const items: Item[] = [];
      for (let l = 0; l < lines; l++) {
        const p = pickWeighted(rand, PRODUCTS);
        if (items.some((x) => x.product === p.name)) continue;
        items.push({ product: p.name, qty: 1 + Math.floor(rand() * p.maxQty), unit: p.price });
      }
      const total = Math.round(items.reduce((s, x) => s + x.qty * x.unit, 0) * 100) / 100;
      const old = back > 10;
      const r = rand();
      const status: Status = r < 0.05 ? "cancelled" : r < 0.085 ? "refunded" : old ? "delivered" : back > 3 ? (r < 0.5 ? "delivered" : "shipped") : r < 0.5 ? "shipped" : "processing";
      orders.push({
        id: `NW-${++n}`,
        date,
        customer: pick(rand, customers),
        region: pick(rand, REGIONS) as Region,
        channel: pickWeighted(rand, CHANNELS.map((c, idx) => ({ c, weight: [6, 3, 1][idx] }))).c as Channel,
        status,
        items,
        total,
      });
    }
  }
  return orders;
}

let cache: Order[] | null = null;
export function getOrders(): Order[] {
  return (cache ??= buildOrders());
}
