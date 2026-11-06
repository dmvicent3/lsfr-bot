import { describe, expect, test } from "bun:test";
import {
  chipsByWeekend,
  leaderboard,
  scoreEntry,
} from "../../../../src/modules/motorsport/predictions/payout.ts";
import { renderPredictionResults } from "../../../../src/modules/motorsport/predictions/render.ts";
import type { Chip, SeasonEntry } from "../../../../src/modules/motorsport/predictions/types.ts";
import type { ResultKind, ResultRow } from "../../../../src/modules/motorsport/results/types.ts";

const row = (pos: string, id: string, name = id): ResultRow => ({
  pos,
  id,
  name,
  team: "",
  time: "",
});
const rows = [row("1", "3", "Verstappen"), row("2", "4", "Norris"), row("3", "16", "Leclerc")];
const PERFECT: [string, string, string] = ["3", "4", "16"];
/** 5 + 2 + 2 = 9. */
const NINE: [string, string, string] = ["3", "16", "4"];

const entry = (
  sessionId: string,
  kind: ResultKind,
  picks: [string, string, string],
  userId = "u",
): SeasonEntry => ({ userId, eventId: "e", sessionId, kind, picks, rows });

const chips = (chip: Chip, userId = "u") => chipsByWeekend([{ userId, eventId: "e", chip }]);
const DOUBLE: Chip = { kind: "double", sessionId: null, position: null };

const pulls = (sessionId: string, kind: ResultKind) =>
  scoreEntry("f1", entry(sessionId, kind, PERFECT), new Map()).pulls;

describe("pulls per F1 session: max × points / 20", () => {
  test("a perfect prediction pays the session's max", () => {
    expect(pulls("qualifying", "qualifying")).toBe(10);
    expect(pulls("race", "race")).toBe(20);
    expect(pulls("sprint-qualification", "sprint-qualifying")).toBe(5);
    expect(pulls("sprint-race", "sprint")).toBe(5);
  });

  test("fractions stay", () => {
    expect(scoreEntry("f1", entry("qualifying", "qualifying", NINE), new Map()).pulls).toBe(4.5);
    expect(scoreEntry("f1", entry("sprint-race", "sprint", NINE), new Map()).pulls).toBe(2.25);
  });

  test("chips can pay past the max", () => {
    expect(scoreEntry("f1", entry("race", "race", PERFECT), chips(DOUBLE))).toEqual({
      points: 40,
      perfect: true,
      pulls: 40,
      chip: DOUBLE,
    });
  });

  test("other series pay nothing", () => {
    expect(scoreEntry("motogp", entry("race", "race", PERFECT), new Map()).pulls).toBe(0);
  });
});

test("a chip shows only on the sessions it changes, and only its owner's", () => {
  const triple: Chip = { kind: "triple", sessionId: "race", position: 0 };
  expect(scoreEntry("f1", entry("qualifying", "qualifying", NINE), chips(triple))).toEqual({
    points: 9,
    perfect: false,
    pulls: 4.5,
    chip: null,
  });
  expect(scoreEntry("f1", entry("race", "race", NINE), chips(triple)).points).toBe(19);
  expect(scoreEntry("f1", entry("race", "race", NINE, "v"), chips(triple)).points).toBe(9);
});

test("the leaderboard counts every F1 session after chips, with pulls", () => {
  const standings = leaderboard(
    "f1",
    [
      entry("qualifying", "qualifying", NINE),
      entry("race", "race", PERFECT),
      entry("race", "race", NINE, "v"),
    ],
    chips(DOUBLE),
  );
  expect(standings).toEqual([
    { userId: "u", points: 58, perfect: 1, played: 2, pulls: 49 },
    { userId: "v", points: 9, perfect: 0, played: 1, pulls: 9 },
  ]);
});

const scored = (userId: string, picks: [string, string, string], chip: Chip | null) => ({
  userId,
  picks,
  score: scoreEntry(
    "f1",
    entry("race", "race", picks, userId),
    chip ? chips(chip, userId) : new Map(),
  ),
});

test("F1 results post: points after the chip, the chip, the pulls", () => {
  expect(
    renderPredictionResults([scored("b", NINE, null), scored("a", PERFECT, DOUBLE)], rows, true),
  ).toBe(
    [
      "### 🔮 Predictions",
      "||<@a> Verstappen · Norris · Leclerc → **40** pts 🎯 · ⏫ Double Weekend · 40 pulls",
      "<@b> Verstappen · Leclerc · Norris → **9** pts · 9 pulls||",
    ].join("\n"),
  );
});
