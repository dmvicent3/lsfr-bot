import { lastValue, tokenize } from "./tokens.ts";
import type { Parsed } from "./types.ts";

/** Discord's message length limit. */
export const SAY_MAX = 2000;

/** `say <text> [--guild id]`: one quoted message for the server's feedback channel. */
export function parseSay(argv: string[]): Parsed {
  const t = tokenize(argv, { values: ["guild"], flags: [] });

  if (typeof t === "string") return { error: t };

  const [text = ""] = t.positional;

  if (t.positional.length !== 1) return { error: "say takes one message; quote it." };

  if (text.trim() === "") return { error: "The message is empty." };

  if (text.length > SAY_MAX) return { error: `The message is over ${SAY_MAX} characters.` };

  return { name: "say", args: { text, guildId: lastValue(t, "guild") } };
}
