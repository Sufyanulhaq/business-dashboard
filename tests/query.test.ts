import { describe, expect, it } from "vitest";
import { href, parseQuery } from "@/lib/query";

describe("parseQuery", () => {
  it("uses the defaults when the URL has nothing", () => {
    expect(parseQuery({})).toEqual({ range: 30, status: "all", region: "all", q: "", sort: "date", dir: "desc", page: 1 });
  });
  it("reads valid values", () => {
    expect(parseQuery({ range: "7", status: "shipped", region: "Wales", q: " desk ", sort: "total", dir: "asc", page: "3" })).toEqual({
      range: 7, status: "shipped", region: "Wales", q: "desk", sort: "total", dir: "asc", page: 3,
    });
  });
  it("falls back to the default for anything unexpected", () => {
    const q = parseQuery({ range: "9999", status: "<script>alert(1)</script>", region: "Mars", sort: "password", dir: "sideways", page: "-5" });
    expect(q).toMatchObject({ range: 30, status: "all", region: "all", sort: "date", dir: "desc", page: 1 });
  });
  it("handles odd page numbers, repeated parameters and a very long search", () => {
    expect(parseQuery({ page: "2.9" }).page).toBe(2);
    expect(parseQuery({ page: "abc" }).page).toBe(1);
    expect(parseQuery({ page: "99999999999" }).page).toBe(10_000);
    expect(parseQuery({ status: ["delivered", "refunded"] }).status).toBe("delivered");
    expect(parseQuery({ q: "x".repeat(500) }).q).toHaveLength(60);
  });
});

describe("href", () => {
  const base = parseQuery({});
  it("leaves default values out of the link", () => {
    expect(href("/", base, {})).toBe("/");
    expect(href("/", base, { range: 90 })).toBe("/?range=90");
  });
  it("goes back to page one when a filter changes, but not when the page does", () => {
    const q = parseQuery({ status: "shipped", page: "4" });
    expect(href("/", q, { region: "Wales" })).toBe("/?status=shipped&region=Wales");
    expect(href("/", q, { page: 5 })).toBe("/?status=shipped&page=5");
  });
  it("encodes a search word safely", () => {
    expect(href("/", base, { q: "a&b=c" })).toBe("/?q=a%26b%3Dc");
  });
});
