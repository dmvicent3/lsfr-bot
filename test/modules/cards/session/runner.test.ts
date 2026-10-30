import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { runMigrations } from "../../../../src/core/db.ts";
import type { SendResult } from "../../../../src/core/types.ts";
import { Runner } from "../../../../src/modules/cards/session/runner.ts";
import { cardsMigrations } from "../../../../src/modules/cards/store/migrations.ts";
import { CardsRepo } from "../../../../src/modules/cards/store/repo.ts";
import type { Outgoing, Poster } from "../../../../src/modules/trivia/session/types.ts";
import { T0, cardAt, deck } from "../fixtures.ts";

class FakePoster implements Poster {
  posts: Outgoing[] = [];
  edits: { id: string; msg: Outgoing }[] = [];
  fail = false;

  async post(msg: Outgoing): Promise<SendResult> {
    if (this.fail) return { result: "lost-channel" };

    this.posts.push(msg);

    return { result: "ok", messageId: `m${this.posts.length}` };
  }

  async edit(id: string, msg: Outgoing): Promise<boolean> {
    this.edits.push({ id, msg });

    return true;
  }
}

const text = (m: Outgoing | undefined): string => JSON.stringify(m?.embeds ?? []);

async function setup(target = 1) {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, cardsMigrations);
  const repo = new CardsRepo(db);
  const poster = new FakePoster();
  const gameId =
    repo.games.start({ guildId: "g", channelId: "c", startedBy: "u1", target, at: T0 }) ?? 0;
  let ended = 0;
  const runner = new Runner(
    {
      gameId,
      guildId: "g",
      channelId: "c",
      starter: { userId: "u1", name: "Ana" },
      target,
      deck: deck(),
      now: T0,
    },
    { repo, poster, random: Math.random, onEnd: () => ended++ },
  );
  await runner.open();
  await runner.onJoin({ userId: "u2", name: "Bo" });
  await runner.onJoin({ userId: "u3", name: "Cy" });

  return { repo, poster, runner, ended: () => ended };
}

const roundId = (r: Runner): string => r.state.round?.id ?? "";

async function playAll(r: Runner): Promise<void> {
  for (const userId of ["u1", "u2", "u3"])
    await r.onPlay({ roundId: roundId(r), userId, cardId: cardAt(r.state, userId) });
}

const voteFor = (r: Runner, userId: string, author: string) =>
  r.onVote({ roundId: roundId(r), userId, index: r.state.round?.order.indexOf(author) ?? -1 });

test("a full game: lobby, start, plays, votes, reveal, a winner", async () => {
  const { repo, poster, runner, ended } = await setup();

  expect(text(poster.posts[0])).toContain("lobby");
  expect(await runner.onStart("u2", T0)).toBe("not-starter");
  expect(await runner.onStart("u1", T0)).toBe("started");
  expect(text(poster.posts[1])).toContain("round 1");

  await playAll(runner);
  await runner.tick(T0 + 1_000);
  expect(text(poster.posts[2])).toContain("**1.**");

  await voteFor(runner, "u1", "u2");
  await voteFor(runner, "u3", "u2");
  await voteFor(runner, "u2", "u1");
  await runner.tick(T0 + 2_000);
  expect(text(poster.posts[3])).toContain("🏆 Bo wins the round");

  await runner.tick(T0 + 11_000);
  expect(text(poster.posts[4])).toContain("👑 **Bo**");
  expect(ended()).toBe(1);
  expect(repo.wins.stats("g", "u2")).toMatchObject({ games: 1, gamesWon: 1, roundsWon: 1 });
});

test("a vote after the phase moved on is refused", async () => {
  const { runner } = await setup(5);
  await runner.onStart("u1", T0);
  const id = roundId(runner);
  await playAll(runner);
  await runner.tick(T0 + 1_000);
  await runner.tick(T0 + 31_000);

  expect(await runner.onVote({ roundId: id, userId: "u1", index: 0 })).toBe("closed");
});

test("players leaving mid-round end the game on the next tick", async () => {
  const { poster, runner, ended } = await setup(5);
  await runner.onStart("u1", T0);
  await runner.onLeave("u3");
  await runner.tick(T0 + 1_000);

  expect(text(poster.posts.at(-1))).toContain("Fewer than 3 players");
  expect(ended()).toBe(1);
});

test("stop posts the standings and ends the game", async () => {
  const { poster, runner, ended } = await setup(5);
  await runner.onStart("u1", T0);
  await runner.stop(T0 + 1_000);

  expect(text(poster.posts.at(-1))).toContain("The game was stopped");
  expect(ended()).toBe(1);
  expect(await runner.onJoin({ userId: "u4", name: "Di" })).toBe("over");
});

test("plays update the round post once per tick", async () => {
  const { poster, runner } = await setup(5);
  await runner.onStart("u1", T0);
  await runner.onPlay({
    roundId: roundId(runner),
    userId: "u1",
    cardId: cardAt(runner.state, "u1"),
  });
  await runner.onPlay({
    roundId: roundId(runner),
    userId: "u2",
    cardId: cardAt(runner.state, "u2"),
  });
  const before = poster.edits.length;
  await runner.tick(T0 + 1_000);

  expect(poster.edits.length - before).toBe(1);
  expect(text(poster.edits.at(-1)?.msg)).toContain("✅ Bo");
});

test("a lost channel ends the game quietly", async () => {
  const { poster, runner, ended } = await setup(5);
  poster.fail = true;
  await runner.onStart("u1", T0);
  await runner.tick(T0 + 1_000);

  expect(ended()).toBe(1);
});
