import { describe, expect, it } from "vitest";
import { byStatus, csvCell, delta, filterOrders, inRange, paginate, previousRange, rangeFor, revenueByDay, revenueByRegion, sortOrders, summarize, toCsv, topProducts } from "@/lib/metrics";
import type { Order } from "@/lib/types";

const order = (o: Partial<Order> & { id: string }): Order => ({
  date: "2026-10-03", customer: "Amelia Nair", region: "London", channel: "Website", status: "delivered",
  items: [{ product: "Desk mat", qty: 1, unit: 29 }], total: 29, ...o,
});

const fixture: Order[] = [
  order({ id: "A1", date: "2026-10-03", total: 100, items: [{ product: "Chair", qty: 1, unit: 100 }] }),
  order({ id: "A2", date: "2026-10-03", total: 60, customer: "Tom Becker", region: "Wales", status: "shipped", items: [{ product: "Chair", qty: 1, unit: 40 }, { product: "Mat", qty: 1, unit: 20 }] }),
  order({ id: "A3", date: "2026-10-01", total: 500, status: "cancelled", items: [{ product: "Desk", qty: 1, unit: 500 }] }),
  order({ id: "A4", date: "2026-09-30", total: 200, status: "refunded", items: [{ product: "Desk", qty: 1, unit: 200 }] }),
  order({ id: "A5", date: "2026-09-30", total: 80, customer: "Amelia Nair", items: [{ product: "Mat", qty: 4, unit: 20 }] }),
  order({ id: "A6", date: "2026-09-20", total: 40, customer: "Hannah Cole" }),
];

describe("ranges", () => {
  it("makes a range of the right length ending on the given day", () => {
    expect(rangeFor("2026-10-03", 7)).toEqual({ from: "2026-09-27", to: "2026-10-03", days: 7 });
  });
  it("makes a previous range of the same length with no gap and no overlap", () => {
    const r = rangeFor("2026-10-03", 7);
    expect(previousRange(r)).toEqual({ from: "2026-09-20", to: "2026-09-26", days: 7 });
  });
  it("keeps only orders inside the range, edges included", () => {
    expect(inRange(fixture, rangeFor("2026-10-03", 4)).map((o) => o.id)).toEqual(["A1", "A2", "A3", "A4", "A5"]);
    expect(inRange(fixture, rangeFor("2026-10-03", 1)).map((o) => o.id)).toEqual(["A1", "A2"]);
  });
});

describe("summary", () => {
  it("counts only delivered, shipped and processing orders as sales", () => {
    const s = summarize(fixture);
    expect(s.orders).toBe(4);
    expect(s.revenue).toBe(280);
    expect(s.aov).toBe(70);
    expect(s.customers).toBe(3);
  });
  it("copes with no orders at all", () => {
    expect(summarize([])).toEqual({ revenue: 0, orders: 0, aov: 0, customers: 0 });
  });
  it("works out change against the previous period", () => {
    expect(delta(150, 100)).toBeCloseTo(0.5);
    expect(delta(50, 100)).toBeCloseTo(-0.5);
    expect(delta(10, 0)).toBeNull();
  });
});

describe("breakdowns", () => {
  it("adds up revenue for every day, with zero for days with no sales", () => {
    const days = revenueByDay(fixture, rangeFor("2026-10-03", 4));
    expect(days.map((d) => d.date)).toEqual(["2026-09-30", "2026-10-01", "2026-10-02", "2026-10-03"]);
    expect(days.map((d) => d.revenue)).toEqual([80, 0, 0, 160]);
  });
  it("ranks products by revenue and counts units, leaving out cancelled and refunded orders", () => {
    expect(topProducts(fixture)).toEqual([
      { product: "Chair", revenue: 140, units: 2 },
      { product: "Mat", revenue: 100, units: 5 },
      { product: "Desk mat", revenue: 29, units: 1 },
    ]);
  });
  it("limits the product list", () => {
    expect(topProducts(fixture, 1)).toHaveLength(1);
  });
  it("counts orders in every status", () => {
    expect(byStatus(fixture)).toEqual({ delivered: 3, shipped: 1, processing: 0, cancelled: 1, refunded: 1 });
  });
  it("adds up revenue by region, biggest first", () => {
    expect(revenueByRegion(fixture)).toEqual([{ region: "London", revenue: 220 }, { region: "Wales", revenue: 60 }]);
  });
});

describe("filtering, sorting and pages", () => {
  it("filters by status, region and a search word", () => {
    expect(filterOrders(fixture, { status: "shipped", region: "all", q: "" }).map((o) => o.id)).toEqual(["A2"]);
    expect(filterOrders(fixture, { status: "all", region: "Wales", q: "" }).map((o) => o.id)).toEqual(["A2"]);
    expect(filterOrders(fixture, { status: "all", region: "all", q: "  becker " }).map((o) => o.id)).toEqual(["A2"]);
    expect(filterOrders(fixture, { status: "all", region: "all", q: "a6" }).map((o) => o.id)).toEqual(["A6"]);
    expect(filterOrders(fixture, { status: "refunded", region: "Wales", q: "" })).toEqual([]);
  });
  it("sorts by total either way and keeps equal rows in a steady order", () => {
    expect(sortOrders(fixture, "total", "desc").map((o) => o.id)).toEqual(["A3", "A4", "A1", "A5", "A2", "A6"]);
    expect(sortOrders(fixture, "total", "asc").map((o) => o.id)[0]).toBe("A6");
    const ties = [order({ id: "B2", total: 5 }), order({ id: "B1", total: 5 })];
    expect(sortOrders(ties, "total", "asc").map((o) => o.id)).toEqual(["B1", "B2"]);
  });
  it("does not change the list it is given", () => {
    const copy = [...fixture];
    sortOrders(fixture, "customer", "asc");
    expect(fixture).toEqual(copy);
  });
  it("pages the rows and clamps a page that is too high or too low", () => {
    const rows = Array.from({ length: 25 }, (_, i) => i);
    expect(paginate(rows, 1).rows).toHaveLength(10);
    expect(paginate(rows, 3)).toMatchObject({ page: 3, pages: 3, total: 25, rows: [20, 21, 22, 23, 24] });
    expect(paginate(rows, 99).page).toBe(3);
    expect(paginate(rows, -4).page).toBe(1);
    expect(paginate(rows, Number.NaN).page).toBe(1);
    expect(paginate([], 1)).toMatchObject({ page: 1, pages: 1, total: 0, rows: [] });
  });
});

describe("csv export", () => {
  it("quotes values with commas, quotes and line breaks", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
  });
  it("defuses cells a spreadsheet would run as a formula", () => {
    for (const bad of ["=SUM(A1:A9)", "+1+1", "-2+3", "@cmd", "\tx"]) expect(csvCell(bad).replace(/^"/, "").startsWith("'")).toBe(true);
    expect(csvCell(-5)).toBe("'-5");
  });
  it("writes a header, one line per order and a final newline", () => {
    const csv = toCsv([fixture[1]]);
    expect(csv.split("\n")).toEqual([
      "id,date,customer,region,channel,status,items,total",
      'A2,2026-10-03,Tom Becker,Wales,Website,shipped,1x Chair; 1x Mat,60.00',
      "",
    ]);
  });
});
