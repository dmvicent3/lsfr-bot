import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isRecord } from "../../src/core/guards.ts";

const API = "https://api.jolpi.ca/ergast/f1";
/** The API's largest page. */
export const PAGE = 100;
/** Between network requests: Jolpica allows 4 a second and 500 an hour; 1.2 s keeps well under both for one run. */
const DELAY_MS = 1200;
const RETRY_MS = 30_000;
const HEADERS = { "User-Agent": "GorkBot/1.0 (Discord bot data build)" };

export interface Downloader {
  /** The JSON at `path` (under the API root), from the download folder when it is already there. */
  get(path: string, file: string): Promise<unknown>;
}

async function fetchJson(url: string): Promise<unknown> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, { headers: HEADERS });

    if (res.ok) return res.json();

    if (res.status !== 429 && res.status < 500) throw new Error(`${url} answered ${res.status}`);

    const asked = Number(res.headers.get("retry-after")) * 1000;
    console.log(`${res.status} on ${url}, waiting`);
    await Bun.sleep(asked > 0 ? asked : RETRY_MS);
  }

  throw new Error(`${url} kept failing`);
}

/** Saves each page as `<dir>/<file>.json`; a page already saved is read back, so a stopped run resumes. */
export function downloader(dir: string): Downloader {
  return {
    async get(path, file) {
      const at = join(dir, `${file}.json`);

      if (existsSync(at)) return JSON.parse(readFileSync(at, "utf8")) as unknown;

      await Bun.sleep(DELAY_MS);
      const data = await fetchJson(`${API}/${path}`);
      writeFileSync(at, JSON.stringify(data));

      return data;
    },
  };
}

/** MRData.total of a page, 0 when missing. */
export function totalOf(page: unknown): number {
  const mr = isRecord(page) && isRecord(page.MRData) ? page.MRData : {};

  return Number(mr.total ?? 0) || 0;
}

/** Every page of a listing, `limit` and `offset` added to `path`. */
export async function allPages(d: Downloader, path: string, name: string): Promise<unknown[]> {
  const first = await d.get(`${path}?limit=${PAGE}&offset=0`, `${name}-0`);
  const pages = [first];

  for (let offset = PAGE; offset < totalOf(first); offset += PAGE) {
    pages.push(await d.get(`${path}?limit=${PAGE}&offset=${offset}`, `${name}-${offset}`));
  }

  return pages;
}
