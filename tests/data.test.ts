import { describe, expect, it } from "vitest";
import { addDays, AS_OF, buildOrders, DAYS_OF_HISTORY, getOrders, mulberry32 } from "@/lib/data";

describe("sample data", () => {
  it("is the same every time for the same seed", () => {
    expect(buildOrders(42)).toEqual(buildOrders(42));
    expect(buildOrders(43)).not.toEqual(buildOrders(42));
  });

  it("covers the history up to the fixed demo date and never past it", () => {
    const dates = getOrders().map((o) => o.date);
    expect(dates.at(-1)).toBe(AS_OF);
    expect(dates.every((d) => d <= AS_OF)).toBe(true);
    expect(new Set(dates).size).toBeGreaterThan(DAYS_OF_HISTORY - 5);
    expect(dates.sort()[0]).toBe(addDays(AS_OF, -(DAYS_OF_HISTORY - 1)));
  });

  it("has orders whose totals equal their lines, with unique ids and no repeated products", () => {
    const orders = getOrders();
    expect(new Set(orders.map((o) => o.id)).size).toBe(orders.length);
    for (const o of orders) {
      expect(o.total).toBeCloseTo(o.items.reduce((s, i) => s + i.qty * i.unit, 0), 2);
      expect(o.total).toBeGreaterThan(0);
      expect(new Set(o.items.map((i) => i.product)).size).toBe(o.items.length);
    }
  });

  it("only has recent orders still processing or shipped", () => {
    const old = getOrders().filter((o) => o.date < addDays(AS_OF, -11));
    expect(old.every((o) => !["processing", "shipped"].includes(o.status))).toBe(true);
  });

  it("random numbers stay between 0 and 1", () => {
    const r = mulberry32(1);
    for (let i = 0; i < 1000; i++) { const v = r(); expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); }
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
