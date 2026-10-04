import { AS_OF, getOrders } from "@/lib/data";
import { filterOrders, inRange, paginate, rangeFor, sortOrders } from "@/lib/metrics";
import { parseQuery } from "@/lib/query";

export async function GET(request: Request) {
  const query = parseQuery(Object.fromEntries(new URL(request.url).searchParams));
  const rows = sortOrders(filterOrders(inRange(getOrders(), rangeFor(AS_OF, query.range)), query), query.sort, query.dir);
  return Response.json({ query, ...paginate(rows, query.page) });
}
