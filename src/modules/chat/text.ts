const MENTION = /<@!?\d+>/g;

export function stripMentions(content: string): string {
  return content.replaceAll(MENTION, "").replaceAll(/\s+/g, " ").trim();
}

export function buildPrompt(userText: string, referenced: string | null): string {
  return referenced === null
    ? userText
    : `[Original message]: ${referenced}\n[User reply]: ${userText}`;
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
