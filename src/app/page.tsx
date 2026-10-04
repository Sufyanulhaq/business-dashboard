import { BarList } from "@/components/BarList";
import { Filters } from "@/components/Filters";
import { KpiCard } from "@/components/KpiCard";
import { OrdersTable, Pagination } from "@/components/OrdersTable";
import { RevenueChart } from "@/components/RevenueChart";
import { AS_OF, getOrders } from "@/lib/data";
import { longDate, money } from "@/lib/format";
import { byStatus, delta, filterOrders, inRange, paginate, previousRange, rangeFor, revenueByDay, revenueByRegion, sortOrders, summarize, topProducts } from "@/lib/metrics";
import { href, parseQuery } from "@/lib/query";
import Link from "next/link";

export default async function Page(props: PageProps<"/">) {
  const query = parseQuery(await props.searchParams);
  const all = getOrders();
  const range = rangeFor(AS_OF, query.range);
  const current = inRange(all, range);
  const now = summarize(current);
  const before = summarize(inRange(all, previousRange(range)));
  const table = paginate(sortOrders(filterOrders(current, query), query.sort, query.dir), query.page);
  const exportParams = new URLSearchParams({ range: String(query.range), status: query.status, region: query.region, q: query.q, sort: query.sort, dir: query.dir });
  const statuses = byStatus(current);

  return (
    <main className="shell">
      <header className="top">
        <div>
          <h1>Sales dashboard</h1>
          <p className="muted">Northwind Goods, {longDate(range.from)} to {longDate(range.to)}</p>
        </div>
        <nav className="ranges" aria-label="Time range">
          {([7, 30, 90] as const).map((d) => (
            <Link key={d} href={href("/", query, { range: d })} aria-current={query.range === d ? "page" : undefined} className={query.range === d ? "on" : ""}>
              Last {d} days
            </Link>
          ))}
        </nav>
      </header>

      <section className="kpis" aria-label="Key figures">
        <KpiCard label="Revenue" value={money(now.revenue)} change={delta(now.revenue, before.revenue)} />
        <KpiCard label="Orders" value={now.orders.toLocaleString("en-GB")} change={delta(now.orders, before.orders)} />
        <KpiCard label="Average order" value={money(now.aov)} change={delta(now.aov, before.aov)} />
        <KpiCard label="Customers" value={now.customers.toLocaleString("en-GB")} change={delta(now.customers, before.customers)} />
      </section>

      <section className="grid2">
        <div className="card">
          <h2>Revenue by day</h2>
          <RevenueChart data={revenueByDay(current, range)} />
        </div>
        <div className="card">
          <h2>Top products</h2>
          <BarList items={topProducts(current).map((p) => ({ label: p.product, value: p.revenue, text: `${money(p.revenue)}, ${p.units} sold` }))} />
        </div>
      </section>

      <section className="grid2 even">
        <div className="card">
          <h2>Revenue by region</h2>
          <BarList items={revenueByRegion(current).map((r) => ({ label: r.region, value: r.revenue, text: money(r.revenue) }))} />
        </div>
        <div className="card">
          <h2>Orders by status</h2>
          <BarList items={Object.entries(statuses).map(([s, n]) => ({ label: s, value: n, text: String(n) }))} />
        </div>
      </section>

      <section className="card">
        <div className="table-head">
          <h2>Orders</h2>
          <a className="btn" href={`/api/orders/export?${exportParams}`} download>Export CSV</a>
        </div>
        <Filters query={query} />
        <OrdersTable rows={table.rows} query={query} />
        <Pagination page={table.page} pages={table.pages} total={table.total} query={query} />
      </section>

      <footer className="foot">Sample data generated for this demo, as of {longDate(AS_OF)}. Cancelled and refunded orders are not counted as revenue.</footer>
    </main>
  );
}
