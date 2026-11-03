import { lastValue, tokenize } from "./tokens.ts";
import type { Parsed, PollRequest } from "./types.ts";

/** Discord's poll limits. */
export const POLL_LIMITS = {
  question: 300,
  option: 55,
  minOptions: 2,
  maxOptions: 10,
  minHours: 1,
  maxHours: 768,
} as const;

const DEFAULT_HOURS = 24;

/** What is wrong with the poll, or null. */
function problem(p: PollRequest): string | null {
  const L = POLL_LIMITS;
  const checks: [boolean, string][] = [
    [p.question.trim() === "", "The question is empty."],
    [p.question.length > L.question, `The question is over ${L.question} characters.`],
    [p.options.length < L.minOptions || p.options.length > L.maxOptions, "Give 2 to 10 --option."],
    [p.options.some((o) => o.trim() === ""), "An option is empty."],
    [p.options.some((o) => o.length > L.option), `An option is over ${L.option} characters.`],
    [
      !Number.isInteger(p.hours) || p.hours < L.minHours || p.hours > L.maxHours,
      `--hours is a whole number from ${L.minHours} to ${L.maxHours}.`,
    ],
  ];

  return checks.find(([bad]) => bad)?.[1] ?? null;
}

/** `poll <question> --option <text>... [--hours n] [--multi] [--guild id]`, validated. */
export function parsePoll(argv: string[]): Parsed {
  const t = tokenize(argv, { values: ["option", "hours", "guild"], flags: ["multi"] });

  if (typeof t === "string") return { error: t };

  if (t.positional.length !== 1) return { error: "poll takes one question; quote it." };

  const hours = lastValue(t, "hours");
  const poll: PollRequest = {
    question: t.positional[0] ?? "",
    options: t.values.get("option") ?? [],
    hours: hours === null ? DEFAULT_HOURS : Number(hours),
    multi: t.flags.has("multi"),
  };
  const wrong = problem(poll);

  return wrong
    ? { error: wrong }
    : { name: "poll", args: { poll, guildId: lastValue(t, "guild") } };
}
