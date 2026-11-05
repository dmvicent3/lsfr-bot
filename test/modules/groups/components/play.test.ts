import { expect, test } from "bun:test";
import { fakeClick } from "../../../core/fake-interaction.ts";
import { viewText } from "../../crossword/view-text.ts";
import { groupsComponents } from "../../../../src/modules/groups/components/components.ts";
import { STALE } from "../../../../src/modules/groups/components/guard.ts";
import { DATE, STAMP, setup, shown, stored } from "./setup.ts";

const handlers = groupsComponents(() => 0.5);
const handler = (action: string) => handlers.find((h) => h.id === `groups:${action}`)!;

async function click(
  action: string,
  args: string[],
  ctx: ReturnType<typeof setup>["ctx"],
  user = "u",
) {
  const { i, calls } = fakeClick(user);
  await handler(action).handle(i, args, ctx);

  return calls;
}

test("every button has a handler", () => {
  expect(handlers.map((h) => h.id)).toEqual([
    "groups:pick",
    "groups:submit",
    "groups:shuffle",
    "groups:clear",
    "groups:giveup",
    "groups:new",
    "groups:page",
  ]);
});

test("a pick selects the word and redraws the board", async () => {
  const { ctx, repo } = setup();
  const calls = await click("pick", [DATE, STAMP, "5"], ctx);

  expect(stored(repo)?.picked).toBe("5");
  expect(shown(calls.update[0])).toContain("Submit (1/4)");
});

test("a right group of four solves it and shows the line", async () => {
  const { ctx, repo } = setup({ picked: "0123" });
  const calls = await click("submit", [DATE, STAMP], ctx);

  expect(stored(repo)).toMatchObject({ found: "0", picked: "" });
  expect(viewText(calls.update[0])).toContain("🟨 **FISH** — BASS · SALMON · TROUT · PIKE");
});

test("three of four costs a mistake and says one away", async () => {
  const { ctx, repo } = setup({ picked: "0124" });
  const calls = await click("submit", [DATE, STAMP], ctx);

  expect(stored(repo)?.mistakes).toBe(1);
  expect(viewText(calls.update[0])).toContain("One away…");
  expect(viewText(calls.update[0])).toContain("●●●○");
});

test("the last group finishes the daily, scores it and announces it", async () => {
  const { ctx, repo } = setup({ found: "012", picked: "cdef", mistakes: 1 });
  const calls = await click("submit", [DATE, STAMP], ctx);

  expect(stored(repo)).toMatchObject({ solved: true, points: 85, streak: 1 });
  expect(calls.send[0]?.content).toContain("solved Groups #1 — 85 pts · 1 mistake");
});

test("the fourth mistake loses, scores 0 and reveals every group", async () => {
  const { ctx, repo } = setup({ picked: "0124", mistakes: 3 });
  const calls = await click("submit", [DATE, STAMP], ctx);

  expect(stored(repo)).toMatchObject({ solved: false, points: 0 });
  expect(viewText(calls.update[0])).toContain("**CARD GAMES**");
  expect(calls.send[0]?.content).toContain("ran out of mistakes on Groups #1");
});

test("give up ends the daily as a loss", async () => {
  const { ctx, repo } = setup();
  const calls = await click("giveup", [DATE, STAMP], ctx);

  expect(stored(repo)).toMatchObject({ solved: false, points: 0 });
  expect(calls.send[0]?.content).toContain("gave up on Groups #1");
});

test("clear empties the selection; shuffle keeps the words", async () => {
  const { ctx, repo } = setup({ picked: "01" });
  await click("clear", [DATE, STAMP], ctx);
  expect(stored(repo)?.picked).toBe("");

  await click("shuffle", [DATE, STAMP], ctx);
  expect(stored(repo)?.order.split("").toSorted().join("")).toBe("0123456789abcdef");
});

test("a button from an earlier round redraws the current board without moving", async () => {
  const { ctx, repo } = setup();
  const calls = await click("pick", [DATE, "zz", "5"], ctx);

  expect(stored(repo)?.picked).toBe("");
  expect(calls.update).toHaveLength(1);
});

test("someone without a game gets the stale note", async () => {
  const { ctx } = setup();
  const calls = await click("pick", [DATE, STAMP, "5"], ctx, "other");

  expect(calls.reply[0]?.content).toBe(STALE);
});

test("a finished game ignores more moves", async () => {
  const { ctx, repo } = setup({
    found: "0123",
    solved: true,
    points: 100,
    streak: 1,
    finishedAt: 5,
  });
  const calls = await click("giveup", [DATE, STAMP], ctx);

  expect(stored(repo)?.points).toBe(100);
  expect(calls.send).toHaveLength(0);
});

test("practice plays unscored and New replaces the round", async () => {
  const { ctx, repo } = setup(null, {});
  const done = await click(
    "submit",
    ["practice", STAMP],
    setup(null, { found: "012", picked: "cdef" }).ctx,
  );
  expect(done.send).toHaveLength(0);
  expect(viewText(done.update[0])).not.toContain("pts");

  const calls = await click("new", [], ctx);
  expect(repo.practice.get("g", "u")?.puzzle.groups).toHaveLength(4);
  expect(repo.practice.get("g", "u")?.startedAt).not.toBe(1);
  expect(shown(calls.update[0])).toContain('"label":"New"');
});
