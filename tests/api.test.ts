import { describe, expect, it } from "vitest";
import { GET as exportCsv } from "@/app/api/orders/export/route";
import { GET as orders } from "@/app/api/orders/route";
import { GET as summary } from "@/app/api/summary/route";
import { AS_OF } from "@/lib/data";

const call = (handler: (r: Request) => Promise<Response>, path: string) => handler(new Request(`http://localhost${path}`));

describe("GET /api/summary", () => {
  it("returns the figures for the chosen range", async () => {
    const r = await call(summary, "/api/summary?range=7");
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.range).toEqual({ from: "2026-09-27", to: AS_OF, days: 7 });
    expect(body.revenueByDay).toHaveLength(7);
    expect(body.summary.revenue).toBeGreaterThan(0);
    expect(body.summary.revenue).toBeCloseTo(body.revenueByDay.reduce((s: number, d: { revenue: number }) => s + d.revenue, 0), 1);
    expect(body.topProducts.length).toBeLessThanOrEqual(5);
  });
  it("treats a nonsense range as the default", async () => {
    expect((await (await call(summary, "/api/summary?range=oops")).json()).range.days).toBe(30);
  });
});

describe("GET /api/orders", () => {
  it("pages the orders newest first", async () => {
    const body = await (await call(orders, "/api/orders")).json();
    expect(body.rows).toHaveLength(10);
    expect(body.pageSize).toBe(10);
    const dates = body.rows.map((o: { date: string }) => o.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
  it("filters by status and region", async () => {
    const body = await (await call(orders, "/api/orders?status=refunded&region=London&range=90")).json();
    expect(body.rows.length).toBeGreaterThan(0);
    expect(body.rows.every((o: { status: string; region: string }) => o.status === "refunded" && o.region === "London")).toBe(true);
  });
  it("returns an empty page rather than an error when nothing matches", async () => {
    const body = await (await call(orders, "/api/orders?q=zzzz-nobody")).json();
    expect(body).toMatchObject({ total: 0, pages: 1, page: 1, rows: [] });
  });
  it("clamps a page number that is too high", async () => {
    const body = await (await call(orders, "/api/orders?page=9999")).json();
    expect(body.page).toBe(body.pages);
    expect(body.rows.length).toBeGreaterThan(0);
  });
});

describe("GET /api/orders/export", () => {
  it("returns a CSV download for the current filters", async () => {
    const r = await call(exportCsv, "/api/orders/export?range=7&status=delivered&sort=total&dir=desc");
    expect(r.status).toBe(200);
    expect(r.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(r.headers.get("content-disposition")).toBe(`attachment; filename="orders-${AS_OF}-last-7-days.csv"`);
    const lines = (await r.text()).trim().split("\n");
    expect(lines[0]).toBe("id,date,customer,region,channel,status,items,total");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.slice(1).every((l) => l.includes(",delivered,"))).toBe(true);
    const totals = lines.slice(1).map((l) => Number(l.split(",").at(-1)));
    expect([...totals].sort((a, b) => b - a)).toEqual(totals);
  });
});
