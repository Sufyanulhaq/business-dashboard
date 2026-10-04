import { AS_OF, getOrders } from "@/lib/data";
import { filterOrders, inRange, rangeFor, sortOrders, toCsv } from "@/lib/metrics";
import { parseQuery } from "@/lib/query";

const MAX_ROWS = 5000;

export async function GET(request: Request) {
  const query = parseQuery(Object.fromEntries(new URL(request.url).searchParams));
  const rows = sortOrders(filterOrders(inRange(getOrders(), rangeFor(AS_OF, query.range)), query), query.sort, query.dir).slice(0, MAX_ROWS);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${AS_OF}-last-${query.range}-days.csv"`,
    },
  });
}
