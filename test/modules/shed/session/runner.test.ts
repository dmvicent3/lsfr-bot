import { expect, test } from "bun:test";
import { T0, move, setup, text } from "./fixtures.ts";

test("a 3-player game to the end: places saved with points, final board, onEnd once", async () => {
  const { repo, poster, runner, ended } = await setup();
  expect(await runner.onStart("u1", T0)).toBe("started");
  expect(text(poster.edits.at(-1)?.msg)).not.toContain("lobby");

  for (let i = 0; i < 3000 && runner.state.phase === "playing"; i++) await move(runner);

  expect(runner.state.phase).toBe("over");
  expect(runner.ended).toBe(true);
  const rows = repo.places.standings("g", 0, Number.MAX_SAFE_INTEGER);
  expect(rows.map((r) => r.points)).toEqual([2, 1, 0]);
  expect(text(poster.edits.at(-1)?.msg)).toContain("game over");
  expect(poster.edits.at(-1)?.msg.components).toEqual([]);
  await runner.stop(T0);
  expect(ended()).toBe(1);
});

test("stale click: refused, nothing changes, the current hand comes back", async () => {
  const { runner } = await setup();
  await runner.onStart("u1", T0);
  const g = runner.state;
  const s = g.seats[g.turn];
  const userId = s?.userId ?? "";
  const before = { turnNo: g.turnNo, cards: s?.hand.length };
  const out = await runner.onDraw({ userId, turnNo: g.turnNo - 1, now: T0 });
  expect(out.result).toBe("stale");
  expect({ turnNo: g.turnNo, cards: s?.hand.length }).toEqual(before);
  expect(out.hand).toEqual(await runner.onHand(userId, 1));
});

test("tick times a turn out", async () => {
  const { runner } = await setup();
  await runner.onStart("u1", T0);
  const first = runner.state.turn;
  await runner.tick(T0 + 60_000);
  expect(runner.state.turn).not.toBe(first);
  expect(runner.state.seats[first]?.idle).toBe(1);
});

test("edits the board once per second at most: two clicks then one tick, one edit", async () => {
  const { poster, runner } = await setup();
  await runner.onStart("u1", T0);
  const edits = poster.edits.length;
  await move(runner);
  await move(runner);
  expect(poster.edits.length).toBe(edits);
  await runner.tick(T0 + 1_000);
  expect(poster.edits.length).toBe(edits + 1);
  await runner.tick(T0 + 2_000);
  expect(poster.edits.length).toBe(edits + 1);
});

test("stop ends with no points", async () => {
  const { repo, poster, runner, ended } = await setup();
  await runner.onStart("u1", T0);
  await runner.stop(T0 + 5);
  expect(repo.places.standings("g", 0, Number.MAX_SAFE_INTEGER)).toEqual([]);
  expect(text(poster.edits.at(-1)?.msg)).toContain("stopped");
  expect(ended()).toBe(1);
  expect(
    repo.games.start({ guildId: "g", channelId: "c", startedBy: "u1", stacking: true, at: 9 }),
  ).not.toBeNull();
});

test("lobby times out", async () => {
  const { poster, runner, ended } = await setup();
  await runner.tick(T0 + 599_000);
  expect(runner.ended).toBe(false);
  await runner.tick(T0 + 600_000);
  expect(runner.ended).toBe(true);
  expect(text(poster.edits.at(-1)?.msg)).toContain("lobby closed");
  expect(ended()).toBe(1);
});
