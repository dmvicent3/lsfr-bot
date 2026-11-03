import { lastValue, positiveId, tokenize } from "./tokens.ts";
import type { Parsed } from "./types.ts";

/** Discord's message length limit. */
export const SAY_MAX = 2000;

/** `say <text> [--guild id] [--close <poll id>]...`: one quoted message for the feedback channel. */
export function parseSay(argv: string[]): Parsed {
  const t = tokenize(argv, { values: ["guild", "close"], flags: [] });

  if (typeof t === "string") return { error: t };

  const [text = ""] = t.positional;

  if (t.positional.length !== 1) return { error: "say takes one message; quote it." };

  if (text.trim() === "") return { error: "The message is empty." };

  if (text.length > SAY_MAX) return { error: `The message is over ${SAY_MAX} characters.` };

  const close = (t.values.get("close") ?? []).map(positiveId);
  const ids = close.filter((id) => id !== null);

  if (ids.length !== close.length) return { error: "--close takes a poll id (whole number)." };

  return { name: "say", args: { text, guildId: lastValue(t, "guild"), close: ids } };
}
