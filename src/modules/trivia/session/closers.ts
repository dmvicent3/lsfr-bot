import { soleSurvivor } from "../perk.ts";
import { openTopics } from "../pick.ts";
import { buttonResults, perkLine, recordLine, winnerLine } from "../render/results.ts";
import { kaosSummary } from "../render/summary.ts";
import { topicSelect } from "../render/topic.ts";
import { buttonAwards } from "../rounds/button.ts";
import type { ButtonRound, KaosRound, TypedRound } from "../rounds/types.ts";
import { send } from "./send.ts";
import { standingOf } from "./standing.ts";
import type { Deps, SessionState } from "./types.ts";

/** How long the sole survivor has to choose. */
export const PERK_MS = 15_000;

export const nameOf = (s: SessionState, userId: string): string =>
  s.names.get(userId) ?? `<@${userId}>`;

/** The winner line and the record line; a timeout needs no post, the embed says it. */
export async function closeTyped(
  s: SessionState,
  d: Deps,
  r: TypedRound,
  now: number,
): Promise<void> {
  const a = r.award;

  if (!a) return;

  const standing = standingOf(d.repo, s.guildId, a.userId, now);
  const record = {
    guildId: s.guildId,
    questionId: r.question.id,
    userId: a.userId,
    ms: a.ms,
    at: now,
  };
  const { previous, improved } = d.repo.records.offer(record);
  const before = previous ? { ms: previous.ms, name: nameOf(s, previous.userId) } : null;
  const win = {
    ...standing,
    name: nameOf(s, a.userId),
    answer: r.question.answer,
    points: a.points,
    ms: a.ms,
  };
  await send(s, d, {
    content: `${winnerLine(win)}\n${recordLine({ ms: a.ms, previous: before, improved })}`,
  });
}

/** The scorers, and the topic menu when exactly one of several players was right. */
export async function closeButton(
  s: SessionState,
  d: Deps,
  r: ButtonRound,
  now: number,
): Promise<void> {
  const picks = r.picks.map((p) => ({ userId: p.userId, right: p.index === r.right }));
  const rows = picks.map((p) => ({ ...p, guildId: s.guildId, questionId: r.question.id, at: now }));
  d.repo.buttonPicks.add(rows);
  const scored = buttonAwards(r).map((a) => ({ ...a, name: nameOf(s, a.userId) }));
  const results = buttonResults(scored, r.question.answer);
  const survivor = soleSurvivor(picks);

  if (!survivor) {
    await send(s, d, { content: results });

    return;
  }

  const topics = openTopics(d.questions, d.repo.asked.lastAskedMap(s.guildId));
  const content = `${results}\n${perkLine(nameOf(s, survivor))}`;
  const messageId = await send(s, d, {
    content,
    components: topicSelect(s.sessionId, topics, { state: "open" }),
  });

  if (messageId) s.perk = { userId: survivor, until: now + PERK_MS, messageId, topics };
}

/** Claims per player, most first, and what nobody found. */
export async function closeKaos(s: SessionState, d: Deps, r: KaosRound): Promise<void> {
  const counts = new Map<string, number>();

  for (const c of r.claims) if (c) counts.set(c.userId, (counts.get(c.userId) ?? 0) + 1);

  const scorers = [...counts]
    .toSorted((a, b) => b[1] - a[1])
    .map(([userId, items]) => ({ name: nameOf(s, userId), items }));
  const missed = r.list.items.filter((_, i) => r.claims[i] === null).map((item) => item.answer);
  await send(s, d, { content: kaosSummary(scorers, missed) });
}
