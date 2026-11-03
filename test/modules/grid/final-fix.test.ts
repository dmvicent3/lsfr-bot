import { Database } from "bun:sqlite";
import { expect, spyOn, test } from "bun:test";
import { runMigrations } from "../../../src/core/db.ts";
import { coreMigrations } from "../../../src/core/settings.ts";
import type { Ctx } from "../../../src/core/types.ts";
import { answerHandler } from "../../../src/modules/grid/components/answer.ts";
import { cellHandler } from "../../../src/modules/grid/components/cell.ts";
import { matchCountry } from "../../../src/modules/grid/match/match.ts";
import { submit } from "../../../src/modules/grid/play/answer.ts";
import { finish } from "../../../src/modules/grid/play/finish.ts";
import { RULES } from "../../../src/modules/grid/rules/catalogue.ts";
import { cellPoints } from "../../../src/modules/grid/scoring.ts";
import { GameStore } from "../../../src/modules/grid/store/games.ts";
import { gridMigrations } from "../../../src/modules/grid/store/migrations.ts";
import { GridRepo } from "../../../src/modules/grid/store/repo.ts";
import type { Grid } from "../../../src/modules/grid/types.ts";
import { fakeClick, fakeModal } from "../../core/fake-interaction.ts";
import { empty, obs, ref, snapshot, state } from "./play/fixtures.ts";
import { GRID } from "./render/fixtures.ts";
import { normaliseName } from "../../../src/core/countries/normalise.ts";
import { game } from "./store/fixtures.ts";

const cut = (s: string) => normaliseName(s).split(" and ")[0] ?? "";
const DATE = "2026-11-03";
const find = (iso2: string) => snapshot.countries.find((c) => c.iso2 === iso2)!;
const gdpGrid: Grid = {
  rows: ["gdp_under_2k", "europe", "africa"],
  cols: ["asia", "eu", "nato"],
  answers: Array.from({ length: 9 }, () => []),
};

function setup(grid: Grid, over: Parameters<typeof game>[0] = {}) {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...gridMigrations]);
  const repo = new GridRepo(db);
  repo.puzzles.create({ guildId: "g", date: DATE, grid });
  repo.games.start(game(over));

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- handlers only read ctx.db
  return { repo, ctx: { db } as unknown as Ctx };
}

test("stat rules know whether the reading exists", () => {
  expect(RULES.gdp_under_2k.known?.(find("KP"))).toBe(false);
  expect(RULES.gdp_over_30k.known?.(find("US"))).toBe(true);
  expect(RULES.area_over_1m.known?.(find("XK"))).toBe(false);
  expect(RULES.europe.known === undefined).toBe(true);
});

test("a country failing a rule it has no data for is a no-cost nodata outcome", () => {
  const grid = { ...gdpGrid, answers: gdpGrid.answers };
  const out = submit(state({ grid }), 0, "North Korea", ref);

  expect(out).toEqual({ kind: "nodata", name: "North Korea", label: "GDP per capita" });
  expect(submit(state({ grid }), 0, "Japan", ref).kind).toBe("miss");
});

test("missing data is no excuse when another rule fails on known data", () => {
  const out = submit(state({ grid: gdpGrid }), 1, "North Korea", ref);

  expect(out.kind).toBe("miss");
});

test("the handler replies ephemerally for no data and writes nothing", async () => {
  const { repo, ctx } = setup(gdpGrid);
  const save = spyOn(GameStore.prototype, "save");
  const { i, calls } = fakeModal("u", "North Korea");
  await answerHandler(() => snapshot).handle(i, [DATE, "0"], ctx);
  const writes = save.mock.calls.length;
  save.mockRestore();

  expect(calls.reply[0]?.content).toBe("No GDP per capita data for North Korea — no guess used.");
  expect(writes).toBe(0);
  expect(calls.update).toHaveLength(0);
  expect(repo.games.get("g", DATE, "u")?.guesses).toBe(0);
});

test("Vatican and Taiwan are not in the list, and cost nothing", async () => {
  const { repo, ctx } = setup(gdpGrid);
  const names = [
    ["Holy See", "Vatican City"],
    ["vatican", "Vatican City"],
    ["Republic of China", "Taiwan"],
  ] as const;

  for (const [typed, shown] of names) {
    const { i, calls } = fakeModal("u", typed);
    await answerHandler(() => snapshot).handle(i, [DATE, "0"], ctx);

    expect(calls.reply[0]?.content).toBe(
      `${shown} isn't in this game's country list — no guess used.`,
    );
  }

  expect(repo.games.get("g", DATE, "u")?.guesses).toBe(0);
});

test("a revisit of a finished daily shows the rebuilt award parts", async () => {
  const picks = ["ES", "FR", "DE", "IT"];
  const cells = empty().map((_, k) => picks[k] ?? "");
  const total = picks.reduce((s, p) => s + cellPoints(p, obs.get(p) ?? 1), 0);
  const { repo, ctx } = setup(GRID);
  const done = finish(repo, game({ cells, guesses: 9, points: total }), 5);
  const { i, calls } = fakeClick("u");
  await cellHandler(() => snapshot).handle(i, [DATE, "8"], ctx);
  const text = calls.update[0]?.content ?? "";

  expect(done.award?.points).toBe(done.game.points ?? -1);
  expect(text).toContain(`4 cells: ${total}`);
  expect(text).toContain(`**+${done.game.points} points**`);
  expect(calls.send).toHaveLength(0);
});

test("alias short keys match exactly, and no key maps to two countries", () => {
  expect(matchCountry("Saint Kitts", snapshot)?.name).toBe("St. Kitts and Nevis");
  expect(matchCountry("Antigua", snapshot)?.name).toBe("Antigua and Barbuda");

  const owners = new Map<string, Set<string>>();

  for (const c of snapshot.countries) {
    const keys = [c.name, ...c.facts.aliases].flatMap((s) => [normaliseName(s), cut(s)]);

    for (const k of keys) owners.set(k, (owners.get(k) ?? new Set()).add(c.iso2));
  }

  const clashes = [...owners].filter(([k, o]) => k !== "" && o.size > 1).map(([k]) => k);

  expect(clashes).toEqual([]);
});
