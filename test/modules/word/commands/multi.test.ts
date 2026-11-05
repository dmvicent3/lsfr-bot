import { expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import { dateIn } from "../../../../src/core/zoned.ts";
import { multiPlay } from "../../../../src/modules/word/commands/multi.ts";
import type { CommandCtx } from "../../../../src/modules/word/commands/types.ts";
import { freshDb } from "../fixtures.ts";

type Sent = { content?: string; components?: unknown[]; flags?: unknown };

function run() {
  const { db, repo } = freshDb();
  runMigrations(db, coreMigrations);
  const sent: Sent[] = [];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handler makes
  const i = {
    user: { id: "u" },
    reply: async (m: Sent) => void sent.push(m),
  } as unknown as CommandCtx["i"];

  return { repo, sent, c: { i, guildId: "g", db, repo, random: () => 0 } };
}

test("/word quad creates today's Quad and opens a private board", async () => {
  const { repo, sent, c } = run();
  await multiPlay("quad")(c);

  const today = dateIn(Date.now(), "Europe/Lisbon");
  expect(repo.multiPuzzles.get("g", "quad", today)?.words).toHaveLength(4);
  expect(sent[0]?.content).toContain("attempts left 9");
  expect(sent[0]?.flags).toBe(MessageFlags.Ephemeral);
  expect(sent[0]?.components).toHaveLength(1);
});

test("/word duo shows the player's own game", async () => {
  const { repo, sent, c } = run();
  await multiPlay("duo")(c);
  const puzzle = repo.multiPuzzles.get("g", "duo", dateIn(Date.now(), "Europe/Lisbon"))!;
  repo.multiGames.saveGuesses({
    ...puzzle,
    userId: "u",
    guesses: [puzzle.words[0]!],
    won: null,
    found: null,
    points: null,
    streak: null,
    finishedAt: null,
  });
  await multiPlay("duo")(c);

  expect(sent[1]?.content).toContain("**Board 1** ✅ attempt 1");
});
