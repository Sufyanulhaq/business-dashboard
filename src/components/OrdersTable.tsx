import Link from "next/link";
import { money2, shortDate } from "@/lib/format";
import { href } from "@/lib/query";
import type { Order, Query, SortKey } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";

function SortHeader({ label, k, query, align }: { label: string; k: SortKey; query: Query; align?: "right" }) {
  const active = query.sort === k;
  const nextDir = active && query.dir === "desc" ? "asc" : "desc";
  return (
    <th scope="col" aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : "none"} className={align}>
      <Link href={href("/", query, { sort: k, dir: nextDir })}>{label}{active ? (query.dir === "asc" ? " ↑" : " ↓") : ""}</Link>
    </th>
  );
}

export function OrdersTable({ rows, query }: { rows: Order[]; query: Query }) {
  if (!rows.length) return <p className="empty">No orders match these filters.</p>;
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">Orders in the selected period</caption>
        <thead>
          <tr>
            <th scope="col">Order</th>
            <SortHeader label="Date" k="date" query={query} />
            <SortHeader label="Customer" k="customer" query={query} />
            <th scope="col">Region</th>
            <th scope="col">Status</th>
            <SortHeader label="Total" k="total" query={query} align="right" />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td className="mono">{o.id}</td>
              <td>{shortDate(o.date)}</td>
              <td>{o.customer}</td>
              <td>{o.region}</td>
              <td><StatusBadge status={o.status} /></td>
              <td className="right">{money2(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, total, query }: { page: number; pages: number; total: number; query: Query }) {
  return (
    <nav className="pager" aria-label="Orders pages">
      <span className="muted">{total.toLocaleString("en-GB")} orders, page {page} of {pages}</span>
      <span className="pager-links">
        {page > 1 ? <Link className="btn" href={href("/", query, { page: page - 1 })}>Previous</Link> : <span className="btn disabled" aria-disabled="true">Previous</span>}
        {page < pages ? <Link className="btn" href={href("/", query, { page: page + 1 })}>Next</Link> : <span className="btn disabled" aria-disabled="true">Next</span>}
      </span>
    </nav>
  );
}
