import { expect, test } from "bun:test";
import { MessageFlags } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import type { Ctx } from "../../../../src/core/types.ts";
import { dateIn } from "../../../../src/core/zoned.ts";
import { modeCommand } from "../../../../src/modules/word/commands/mode.ts";
import { multiGuess } from "../../../../src/modules/word/commands/multi-guess.ts";
import { multiLetters } from "../../../../src/modules/word/commands/multi-letters.ts";
import { multiPlay } from "../../../../src/modules/word/commands/multi.ts";
import type { CommandCtx } from "../../../../src/modules/word/commands/types.ts";
import { freshDb } from "../fixtures.ts";

type Sent = { content?: string; components?: unknown[]; flags?: unknown };

function run(word = "") {
  const { db, repo } = freshDb();
  runMigrations(db, coreMigrations);
  const sent: Sent[] = [];
  const posted: Sent[] = [];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handler makes
  const i = {
    user: { id: "u" },
    channelId: "c",
    reply: async (m: Sent) => void sent.push(m),
    followUp: async (m: Sent) => void posted.push(m),
    options: { getString: () => word },
  } as unknown as CommandCtx["i"];

  return { repo, sent, posted, c: { i, guildId: "g", db, repo, random: () => 0 } };
}

test("/quad play creates today's Quad and opens a private board", async () => {
  const { repo, sent, c } = run();
  await multiPlay("quad")(c);

  const today = dateIn(Date.now(), "Europe/Lisbon");
  expect(repo.multiPuzzles.get("g", "quad", today)?.words).toHaveLength(4);
  expect(sent[0]?.content).toContain("attempts left 9");
  expect(sent[0]?.flags).toBe(MessageFlags.Ephemeral);
  expect(sent[0]?.components).toHaveLength(1);
});

test("/duo play shows the player's own game", async () => {
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

  expect(sent[1]?.content).toContain("**Board 1** ✅ │ **Board 2**");
});

test("/duo letters shows each board's notes privately", async () => {
  const { repo, sent, c } = run();
  await multiLetters("duo")(c);
  expect(sent[0]?.content).toEndWith("No guesses yet. Guess with `/duo guess`.");

  const puzzle = repo.multiPuzzles.get("g", "duo", dateIn(Date.now(), "Europe/Lisbon"))!;
  repo.multiGames.saveGuesses({
    ...puzzle,
    userId: "u",
    guesses: [puzzle.words[1]!],
    won: null,
    found: null,
    points: null,
    streak: null,
    finishedAt: null,
  });
  await multiLetters("duo")(c);

  expect(sent[1]?.content).toContain(`**Board 2** ✅ ${puzzle.words[1]!.toUpperCase()}`);
  expect(sent[1]?.content).toContain("**Board 1**\n");
  expect(sent[1]?.flags).toBe(MessageFlags.Ephemeral);
});

test("/quad routes its subcommands", async () => {
  const { sent, c } = run();
  const command = modeCommand("quad", () => 0);
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the subcommand and guild are all execute reads
  const i = {
    user: { id: "u" },
    reply: async (m: Sent) => void sent.push(m),
    guildId: "g",
    options: { getSubcommand: () => "play" },
  } as unknown as CommandCtx["i"];
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- execute only reads ctx.db
  await command.execute(i, { db: c.db } as unknown as Ctx);

  expect(sent[0]?.content).toContain("**Word Quad #");
});

test("/duo guess plays one word on every board, privately", async () => {
  const { repo, sent, posted, c } = run("CRANE");
  await multiGuess("duo")(c);

  const puzzle = repo.multiPuzzles.get("g", "duo", dateIn(Date.now(), "Europe/Lisbon"))!;
  expect(repo.multiGames.get({ ...puzzle, userId: "u" })?.guesses).toEqual(["crane"]);
  expect(sent[0]?.content).toContain("`CRANE`");
  expect(sent[0]?.content).toContain("attempts left 6");
  expect(sent[0]?.flags).toBe(MessageFlags.Ephemeral);
  expect(posted).toHaveLength(0);
});

test("/duo guess refuses a word not in the list and costs nothing", async () => {
  const { repo, sent, c } = run("zzzzz");
  await multiGuess("duo")(c);

  const puzzle = repo.multiPuzzles.get("g", "duo", dateIn(Date.now(), "Europe/Lisbon"))!;
  expect(sent[0]?.content).toBe("That's not in the word list. No attempt used.");
  expect(repo.multiGames.get({ ...puzzle, userId: "u" })).toBeNull();
});

test("/duo guess that finds the last word wins and posts the squares", async () => {
  const { repo, sent, posted, c } = run();
  await multiPlay("duo")(c);
  const puzzle = repo.multiPuzzles.get("g", "duo", dateIn(Date.now(), "Europe/Lisbon"))!;
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- swap the typed word per call
  const typed = c.i as unknown as { options: { getString: () => string } };

  for (const w of puzzle.words) {
    typed.options.getString = () => w;
    await multiGuess("duo")(c);
  }

  expect(repo.multiGames.get({ ...puzzle, userId: "u" })).toMatchObject({ won: true, found: 2 });
  expect(sent.at(-1)?.content).toContain("All 2 solved!");
  expect(sent.at(-1)?.components).toEqual([]);
  expect(posted[0]?.content).toStartWith("<@u> solved Word Duo #");
  expect(posted[0]?.content).not.toContain(puzzle.words[0]!.toUpperCase());
});
