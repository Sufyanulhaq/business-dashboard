export const STATUSES = ["delivered", "shipped", "processing", "cancelled", "refunded"] as const;
export type Status = (typeof STATUSES)[number];
export const REGIONS = ["London", "North West", "Midlands", "Scotland", "Wales"] as const;
export type Region = (typeof REGIONS)[number];
export const CHANNELS = ["Website", "Marketplace", "Phone"] as const;
export type Channel = (typeof CHANNELS)[number];

export interface Item {
  product: string;
  qty: number;
  unit: number;
}

export interface Order {
  id: string;
  date: string; // YYYY-MM-DD
  customer: string;
  region: Region;
  channel: Channel;
  status: Status;
  items: Item[];
  total: number;
}

/** Orders in these states count as sales. Cancelled and refunded ones do not. */
export const COUNTED: readonly Status[] = ["delivered", "shipped", "processing"];

export const SORTS = ["date", "total", "customer"] as const;
export type SortKey = (typeof SORTS)[number];

export interface Query {
  range: 7 | 30 | 90;
  status: Status | "all";
  region: Region | "all";
  q: string;
  sort: SortKey;
  dir: "asc" | "desc";
  page: number;
}
