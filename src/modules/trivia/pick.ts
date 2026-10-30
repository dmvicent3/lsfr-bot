import type { KaosList, Question, RoundChoice } from "./types.ts";

const KAOS_SHARE = 0.1;
const TYPED_SHARE = 2 / 3;
/** A Discord select menu holds 25 options. */
const MAX_TOPICS = 25;

type LastAsked = ReadonlyMap<string, number>;

export const askedKey = (kind: "question" | "kaos", id: number): string => `${kind}:${id}`;

/** The never-asked items, or else the ones asked longest ago. */
function leastRecent<T>(items: readonly T[], key: (t: T) => string, lastAsked: LastAsked): T[] {
  const never = items.filter((t) => !lastAsked.has(key(t)));

  if (never.length > 0) return never;

  const oldest = Math.min(...items.map((t) => lastAsked.get(key(t)) ?? 0));

  return items.filter((t) => lastAsked.get(key(t)) === oldest);
}

function draw<T>(items: T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)];

  if (item === undefined) throw new Error("trivia: nothing to pick from");

  return item;
}

const questionKey = (q: Question): string => askedKey("question", q.id);

/** KAOS one in ten (never on a chosen topic), else typed two in three; least recently asked first. */
export function pickRound(p: {
  questions: readonly Question[];
  lists: readonly KaosList[];
  lastAsked: LastAsked;
  topic: string | null;
  random: () => number;
}): RoundChoice {
  const kaosDraw = p.random();

  if (kaosDraw < KAOS_SHARE && p.topic === null && p.lists.length > 0) {
    const lists = leastRecent(p.lists, (l) => askedKey("kaos", l.id), p.lastAsked);

    return { kind: "kaos", list: draw(lists, p.random) };
  }

  const inTopic = p.questions.filter((q) => q.category === p.topic);
  const pool = inTopic.length > 0 ? inTopic : p.questions;
  const typed = pool.filter((q) => q.kind === "typed");
  const choice = pool.filter((q) => q.kind === "choice");
  const wantTyped = p.random() < TYPED_SHARE;
  const kind = (wantTyped && typed.length > 0) || choice.length === 0 ? "typed" : "button";
  const candidates = leastRecent(kind === "typed" ? typed : choice, questionKey, p.lastAsked);

  return { kind, question: draw(candidates, p.random) };
}

/** Categories with a never-asked question (all of them once none are left), sorted, at most 25. */
export function openTopics(questions: readonly Question[], lastAsked: LastAsked): string[] {
  const all = new Set(questions.map((q) => q.category));
  const open = new Set(
    questions.filter((q) => !lastAsked.has(questionKey(q))).map((q) => q.category),
  );

  return [...(open.size > 0 ? open : all)].toSorted().slice(0, MAX_TOPICS);
}
