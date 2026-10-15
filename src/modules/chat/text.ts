import type { InlineImage, Turn } from "../../core/llm.ts";

const MENTION = /<@!?\d+>/g;

export function stripMentions(content: string): string {
  return content.replaceAll(MENTION, "").replaceAll(/\s+/g, " ").trim();
}

/** How many messages of a reply chain (including the new one) Gork remembers. */
export const MAX_CHAIN = 10;

export interface ChainMessage {
  fromBot: boolean;
  author: string;
  text: string;
  images?: InlineImage[];
}

/**
 * Walks a reply chain back from `start` (at most MAX_CHAIN messages) and returns it oldest
 * first. A parent that can't be fetched (deleted, no access) ends the chain.
 */
export async function collectChain<M>(
  start: M,
  parentOf: (message: M) => Promise<M | null>,
): Promise<M[]> {
  const chain = [start];
  let current = start;
  while (chain.length < MAX_CHAIN) {
    let parent: M | null;
    try {
      parent = await parentOf(current);
    } catch {
      break;
    }
    if (parent === null) break;
    chain.unshift(parent);
    current = parent;
  }
  return chain;
}

/**
 * A reply chain as a Gemini conversation: Gork's messages are model turns, everyone else's
 * are user turns prefixed with their name (several people can share a chain). Gemini wants
 * alternating turns starting with the user, so neighbours merge and a leading model turn
 * gets a placeholder before it.
 */
export function buildConversation(chain: ChainMessage[]): Turn[] {
  const turns: Turn[] = [];
  for (const m of chain) {
    const images = m.images ?? [];
    const text = stripMentions(m.text) || (images.length > 0 ? "(sent an image)" : "");
    if (!text) continue;
    const role = m.fromBot ? "model" : "user";
    const line = m.fromBot ? text : `${m.author}: ${text}`;
    const last = turns.at(-1);
    if (last?.role === role) {
      last.text += `\n${line}`;
      if (images.length > 0) last.images = [...(last.images ?? []), ...images];
    } else {
      turns.push({ role, text: line, ...(images.length > 0 ? { images } : {}) });
    }
  }
  if (turns[0]?.role === "model") turns.unshift({ role: "user", text: "(earlier conversation)" });
  return turns;
}

/** Splits text into Discord-sized chunks, cutting at the last newline inside the limit. */
export function splitMessage(text: string, max = 2000): string[] {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > max) {
    const newline = rest.lastIndexOf("\n", max);
    const cut = newline > 0 ? newline : max;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(newline > 0 ? cut + 1 : cut);
  }
  if (rest) chunks.push(rest);
  return chunks;
}
