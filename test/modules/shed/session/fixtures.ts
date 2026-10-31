import { Database } from "bun:sqlite";
import { runMigrations } from "../../../../src/core/db.ts";
import type { SendResult } from "../../../../src/core/types.ts";
import { cardKey } from "../../../../src/modules/shed/game/deck.ts";
import { isLegal } from "../../../../src/modules/shed/game/legal.ts";
import { Runner } from "../../../../src/modules/shed/session/runner.ts";
import { shedMigrations } from "../../../../src/modules/shed/store/migrations.ts";
import { ShedRepo } from "../../../../src/modules/shed/store/repo.ts";
import type { Outgoing, Poster } from "../../../../src/modules/trivia/session/types.ts";
import { seeded } from "../testing/random.ts";

export const T0 = 1_000_000;

export class FakePoster implements Poster {
  posts: Outgoing[] = [];
  edits: { id: string; msg: Outgoing }[] = [];

  async post(msg: Outgoing): Promise<SendResult> {
    this.posts.push(msg);

    return { result: "ok", messageId: `m${this.posts.length}` };
  }

  async edit(id: string, msg: Outgoing): Promise<boolean> {
    this.edits.push({ id, msg });

    return true;
  }
}

/** A lobby with u1 (starter), u2 and u3 seated. */
export async function setup() {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, shedMigrations);
  const repo = new ShedRepo(db);
  const poster = new FakePoster();
  const p = { guildId: "g", channelId: "c", stacking: true };
  const gameId = repo.games.start({ ...p, startedBy: "u1", at: T0 }) ?? 0;
  let ended = 0;
  const runner = new Runner(
    { ...p, gameId, starter: { userId: "u1", name: "Ana" }, now: T0 },
    { repo, poster, random: seeded(7), onEnd: () => ended++ },
  );
  await runner.open();
  await runner.onJoin({ userId: "u2", name: "Bo" }, false);
  await runner.onJoin({ userId: "u3", name: "Cy" }, false);

  return { repo, poster, runner, ended: () => ended };
}

/** One move for whoever's turn it is: pick red, pass a drawn card, play the first legal card, or draw. */
export async function move(r: Runner): Promise<void> {
  const g = r.state;
  const s = g.seats[g.turn];
  const c = { userId: s?.userId ?? "", turnNo: g.turnNo, now: T0 };
  const top = g.discard.at(-1);

  if (g.step === "paint") return void (await r.onPaint({ ...c, colour: "red" }));

  if (g.step === "drawn") return void (await r.onPass(c));

  const card = s?.hand.find((x) => top && isLegal(x, top, g.colour, g.pending));

  if (!card) return void (await r.onDraw(c));

  await r.onPlay({ ...c, key: cardKey(card), count: 1, last: true });
}

export const text = (m: Outgoing | undefined): string => JSON.stringify(m?.embeds ?? []);
