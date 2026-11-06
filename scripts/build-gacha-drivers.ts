/**
 * Builds src/modules/gacha/data/drivers.json from the Jolpica F1 API (the Ergast successor).
 * Usage: bun scripts/build-gacha-drivers.ts <download-dir> [--download-only], then `bun run fmt`.
 * Pages already in <download-dir> are reused, so a stopped run resumes; a new empty folder
 * fetches everything again and refreshes the snapshot.
 */
import { writeFileSync } from "node:fs";
import { downloader } from "./gacha-drivers/fetch.ts";
import { downloadAll } from "./gacha-drivers/download.ts";
import { snapshotOf, summary } from "./gacha-drivers/snapshot.ts";

const OUT = new URL("../src/modules/gacha/data/drivers.json", import.meta.url);

async function main(): Promise<void> {
  const [dir] = process.argv.slice(2).filter((a) => !a.startsWith("--"));

  if (!dir) throw new Error("usage: bun scripts/build-gacha-drivers.ts <download-dir>");

  const today = new Date();
  const pages = await downloadAll(downloader(dir), today.getUTCFullYear());
  console.log(`downloaded ${pages.results.length} result pages`);

  if (process.argv.includes("--download-only")) return;

  const snapshot = snapshotOf(pages, today.toISOString().slice(0, 10));
  writeFileSync(OUT, JSON.stringify(snapshot));
  console.log(`${snapshot.drivers.length} drivers`);
  console.log(summary(snapshot.drivers).join("\n"));
}

await main();
