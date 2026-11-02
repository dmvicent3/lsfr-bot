import { describe, expect, test } from "bun:test";
import {
  fetchWbCountries,
  fetchWbIndicator,
  fetchWikidata,
} from "../../../scripts/duel-data/fetch.ts";

function fake(body: unknown, ok = true) {
  const calls: { url: string; init: RequestInit | undefined }[] = [];

  const stub = async (url: string, init?: RequestInit) => {
    calls.push({ url, init });

    return new Response(JSON.stringify(body), { status: ok ? 200 : 500 });
  };

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the one call the build makes
  const fn = stub as unknown as typeof fetch;

  return { fn, calls };
}

describe("fetch", () => {
  test("World Bank countries and indicator URLs use format=json", async () => {
    const f = fake([]);

    await fetchWbCountries(f.fn);
    await fetchWbIndicator(f.fn, "SP.POP.TOTL", 2025);

    expect(f.calls[0]?.url).toContain("api.worldbank.org/v2/country");
    expect(f.calls[0]?.url).toContain("format=json");
    expect(f.calls[1]?.url).toContain("/indicator/SP.POP.TOTL");
    expect(f.calls[1]?.url).toContain("format=json");
    expect(f.calls[1]?.url).toContain("date=2015:2025");
  });

  test("Wikidata sends Accept and User-Agent", async () => {
    const f = fake({});

    await fetchWikidata(f.fn);

    const headers = new Headers(f.calls[0]?.init?.headers);

    expect(f.calls[0]?.url).toContain("query.wikidata.org/sparql");
    expect(headers.get("Accept")).toBe("application/sparql-results+json");
    expect(headers.get("User-Agent")).toContain("GorkBot/1.0");
  });

  test("a failed response throws", async () => {
    expect(fetchWbCountries(fake([], false).fn)).rejects.toThrow();
  });
});
