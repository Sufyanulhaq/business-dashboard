import Link from "next/link";
import { REGIONS, STATUSES, type Query } from "@/lib/types";

/** A plain GET form, so filtering works without any client side JavaScript. */
export function Filters({ query }: { query: Query }) {
  return (
    <form className="filters" method="get" action="/">
      <input type="hidden" name="range" value={query.range} />
      <input type="hidden" name="sort" value={query.sort} />
      <input type="hidden" name="dir" value={query.dir} />
      <label>
        <span>Search</span>
        <input type="search" name="q" defaultValue={query.q} placeholder="Order or customer" maxLength={60} />
      </label>
      <label>
        <span>Status</span>
        <select name="status" defaultValue={query.status}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <label>
        <span>Region</span>
        <select name="region" defaultValue={query.region}>
          <option value="all">All regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <button type="submit" className="btn primary">Apply</button>
      <Link className="btn" href={`/${query.range === 30 ? "" : `?range=${query.range}`}`}>Reset</Link>
    </form>
  );
}
