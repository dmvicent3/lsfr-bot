import { pickRound } from "../pick.ts";
import { buttonStart } from "../rounds/button.ts";
import { kaosStart } from "../rounds/kaos.ts";
import { typedStart } from "../rounds/typed.ts";
import type { Round } from "../rounds/types.ts";
import type { RoundChoice } from "../types.ts";
import type { PictureFile } from "./image.ts";
import { itemOf, roundMessage } from "./round-ops.ts";
import { send } from "./send.ts";
import type { Deps, Outgoing, SessionState } from "./types.ts";

function build(choice: RoundChoice, s: SessionState, d: Deps, now: number): Round {
  const id = `${s.sessionId}-${s.rounds + 1}`;

  if (choice.kind === "kaos") return kaosStart(choice.list, id, now);

  if (choice.kind === "typed") return typedStart(choice.question, id, now, d.random);

  return buttonStart(choice.question, { id, now, random: d.random, expected: s.lastPlayers });
}

/** The next round and, for a picture, its image; a picture that will not download is skipped. */
async function choose(
  s: SessionState,
  d: Deps,
): Promise<{ choice: RoundChoice; file: PictureFile | null }> {
  const p = {
    questions: d.questions,
    lists: d.lists,
    pictures: d.pictures,
    lastAsked: d.repo.asked.lastAskedMap(s.guildId),
    topic: s.topic?.name ?? null,
    random: d.random,
  };
  const choice = pickRound(p);
  const image = choice.kind === "kaos" ? undefined : choice.question.image;

  if (image === undefined) return { choice, file: null };

  const file = await d.fetchImage(image);

  return file ? { choice, file } : { choice: pickRound({ ...p, pictures: [] }), file: null };
}

/** The round's first post, carrying its image when it has one. */
function firstPost(round: Round, s: SessionState, file: PictureFile | null): Outgoing {
  const msg = roundMessage(round, s);

  return file ? { ...msg, files: [{ attachment: file.data, name: file.name }] } : msg;
}

/** Picks, records and posts the next round, using up a chosen topic. */
export async function openRound(s: SessionState, d: Deps, now: number): Promise<void> {
  const { choice, file } = await choose(s, d);
  const at = file ? d.now() : now;
  const round = build(choice, s, d, at);
  const item = itemOf(round);
  d.repo.asked.add({
    guildId: s.guildId,
    channelId: s.channelId,
    kind: item.kind,
    itemId: item.id,
    at,
  });
  s.topicBy = s.topic?.by ?? null;
  s.topic = null;
  s.round = round;
  s.dirty = false;
  s.active = new Set();
  s.image = file?.name ?? null;
  s.messageId = await send(s, d, firstPost(round, s, file));
}
