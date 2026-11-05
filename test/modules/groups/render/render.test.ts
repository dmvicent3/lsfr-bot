import { expect, test } from "bun:test";
import { ButtonStyle, ComponentType } from "discord.js";
import { boardView } from "../../../../src/modules/groups/render/board-view.ts";
import { wordIndexOf } from "../../../../src/modules/groups/render/ids.ts";
import { groupLine, mistakesLeft } from "../../../../src/modules/groups/render/lines.ts";
import { resultLine } from "../../../../src/modules/groups/render/result.ts";
import { groupsView } from "../../../../src/modules/groups/render/view.ts";
import { flatComponents, viewText } from "../../crossword/view-text.ts";
import { PUZZLE } from "../play/fixtures.ts";
import { game, practice } from "../store/fixtures.ts";

const daily = { scope: "2026-11-05", number: 3, puzzle: PUZZLE, untilNext: "5h 2m" };
interface Btn {
  custom_id: string;
  label: string;
  style: number;
  disabled?: boolean;
}

const isButton = (c: object): c is Btn => "type" in c && c.type === ComponentType.Button;
const buttons = (m: ReturnType<typeof groupsView>): Btn[] =>
  flatComponents(m.components).filter(isButton);

test("lines: a group in its colour, mistakes left as dots", () => {
  expect(groupLine(PUZZLE.groups[0]!)).toBe("🟨 **FISH** — BASS · SALMON · TROUT · PIKE");
  expect(mistakesLeft(1)).toBe("●●●○");
  expect(mistakesLeft(4)).toBe("○○○○");
});

test("a fresh daily: header, sixteen word buttons in rows of four, controls", () => {
  const m = groupsView(boardView(daily, game({ picked: "05" })));
  const all = buttons(m);

  expect(viewText(m)).toBe("**Groups #3** · Mistakes left ●●●●");
  expect(m.components).toHaveLength(6);
  expect(all).toHaveLength(20);
  expect(all[0]).toMatchObject({ custom_id: "groups:pick:2026-11-05:1:0", label: "BASS" });
  expect(all[0]!.style).toBe(ButtonStyle.Primary);
  expect(all[1]!.style).toBe(ButtonStyle.Secondary);
  expect(all.slice(16).map((b) => [b.label, b.disabled ?? false])).toEqual([
    ["Submit (2/4)", true],
    ["Shuffle", false],
    ["Clear", false],
    ["Give up", false],
  ]);
});

test("found groups show above the grid and leave it; the last line follows", () => {
  const m = groupsView(
    boardView(daily, game({ found: "2", picked: "0124", lastLine: "One away…" })),
  );

  expect(viewText(m)).toBe(
    [
      "**Groups #3** · Mistakes left ●●●●",
      "🟦 **DANCES** — TANGO · WALTZ · POLKA · SAMBA",
      "One away…",
    ].join("\n"),
  );
  expect(buttons(m).filter((b) => b.custom_id.includes(":pick:"))).toHaveLength(12);
  expect(buttons(m).find((b) => b.label === "Submit (4/4)")?.disabled).toBe(false);
});

test("a finished daily shows the missed groups, the award and no buttons", () => {
  const lost = game({
    found: "1",
    mistakes: 4,
    solved: false,
    points: 0,
    streak: 0,
    finishedAt: 9,
  });
  const m = groupsView(boardView(daily, lost));
  const text = viewText(m);

  expect(text).toContain("Missed:\n🟨 **FISH**");
  expect(text).toContain("Out of mistakes — 0 points");
  expect(text).toContain("Next groups in 5h 2m");
  expect(buttons(m)).toHaveLength(0);
});

test("a solved daily lists its points", () => {
  const won = game({
    found: "0123",
    mistakes: 1,
    solved: true,
    points: 85,
    streak: 1,
    finishedAt: 9,
  });

  expect(viewText(groupsView(boardView(daily, won)))).toContain("Mistakes: −15\n**85 points**");
});

test("practice has New, also once finished", () => {
  const where = { scope: "practice", number: null, puzzle: PUZZLE };
  const playing = groupsView(boardView(where, practice()));
  const done = groupsView(boardView(where, practice({ found: "0123", finishedAt: 3 })));

  expect(viewText(playing)).toStartWith("**Practice groups**");
  expect(buttons(playing).at(-1)).toMatchObject({ custom_id: "groups:new", label: "New" });
  expect(buttons(done).map((b) => b.label)).toEqual(["New"]);
  expect(viewText(done)).toContain("Solved!\nMistakes: 0");
});

test("the announcement names the outcome and the solve order", () => {
  const won = game({ found: "0312", mistakes: 1, solved: true, points: 85, finishedAt: 9 });
  const quit = game({ found: "", mistakes: 0, solved: false, points: 0, finishedAt: 9 });

  expect(resultLine(3, won, PUZZLE)).toBe("<@u> solved Groups #3 — 85 pts · 1 mistake · 🟨🟪🟩🟦");
  expect(resultLine(3, quit, PUZZLE)).toBe("<@u> gave up on Groups #3 — no groups");
  expect(resultLine(3, { ...quit, mistakes: 4, found: "0" }, PUZZLE)).toBe(
    "<@u> ran out of mistakes on Groups #3 — 🟨",
  );
});

test("pick ids name words 0-15 only", () => {
  expect(wordIndexOf("15")).toBe(15);
  expect(wordIndexOf("16")).toBeNull();
  expect(wordIndexOf("x")).toBeNull();
  expect(wordIndexOf(undefined)).toBeNull();
});
