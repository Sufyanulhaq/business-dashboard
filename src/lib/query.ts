import { REGIONS, SORTS, STATUSES, type Query } from "./types";

type Raw = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Turns whatever is in the URL into a safe query. Anything unexpected falls back to the default. */
export function parseQuery(raw: Raw): Query {
  const range = Number(first(raw.range));
  const status = first(raw.status);
  const region = first(raw.region);
  const sort = first(raw.sort);
  const page = Math.floor(Number(first(raw.page)));
  return {
    range: range === 7 || range === 90 ? range : 30,
    status: (STATUSES as readonly string[]).includes(status ?? "") ? (status as Query["status"]) : "all",
    region: (REGIONS as readonly string[]).includes(region ?? "") ? (region as Query["region"]) : "all",
    q: (first(raw.q) ?? "").trim().slice(0, 60),
    sort: (SORTS as readonly string[]).includes(sort ?? "") ? (sort as Query["sort"]) : "date",
    dir: first(raw.dir) === "asc" ? "asc" : "desc",
    page: Number.isFinite(page) && page >= 1 ? Math.min(page, 10_000) : 1,
  };
}

const DEFAULTS: Query = { range: 30, status: "all", region: "all", q: "", sort: "date", dir: "desc", page: 1 };

/** A link to the same page with some settings changed. Default values are left out of the URL. */
export function href(base: string, query: Query, change: Partial<Query>): string {
  const next = { ...query, ...change };
  if (!("page" in change)) next.page = 1; // changing a filter goes back to page one
  const params = new URLSearchParams();
  (Object.keys(DEFAULTS) as (keyof Query)[]).forEach((k) => {
    if (String(next[k]) !== String(DEFAULTS[k])) params.set(k, String(next[k]));
  });
  const s = params.toString();
  return s ? `${base}?${s}` : base;
}
