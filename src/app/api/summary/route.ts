import { AS_OF, getOrders } from "@/lib/data";
import { byStatus, delta, inRange, previousRange, rangeFor, revenueByDay, summarize, topProducts } from "@/lib/metrics";
import { parseQuery } from "@/lib/query";

export async function GET(request: Request) {
  const query = parseQuery(Object.fromEntries(new URL(request.url).searchParams));
  const all = getOrders();
  const range = rangeFor(AS_OF, query.range);
  const current = inRange(all, range);
  const now = summarize(current);
  const before = summarize(inRange(all, previousRange(range)));
  return Response.json({
    range,
    summary: now,
    previous: before,
    deltas: { revenue: delta(now.revenue, before.revenue), orders: delta(now.orders, before.orders), aov: delta(now.aov, before.aov), customers: delta(now.customers, before.customers) },
    topProducts: topProducts(current),
    byStatus: byStatus(current),
    revenueByDay: revenueByDay(current, range),
  });
}
