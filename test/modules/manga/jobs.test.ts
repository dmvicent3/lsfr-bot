import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import type { Ctx } from "../../../src/core/types.ts";
import { mangaJobs } from "../../../src/modules/manga/jobs.ts";
import { mangaMigrations } from "../../../src/modules/manga/store/migrations.ts";

describe("mangaJobs", () => {
  test("one 4-hourly poll that runs on start", () => {
    const [job] = mangaJobs(async () => ({}));
    expect(job).toMatchObject({ name: "poll", cron: "0 */4 * * *", runOnStart: true });
  });

  test("without a channel the poll asks MangaDex nothing", async () => {
    const db = new Database(":memory:", { strict: true });
    runMigrations(db, [...coreMigrations, ...mangaMigrations]);
    const paths: string[] = [];
    const [job] = mangaJobs(async (path) => {
      paths.push(path);

      return {};
    });
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the poll reads only db before skipping
    await job?.run({ db } as unknown as Ctx);
    expect(paths).toEqual([]);
  });
});
