/** `text` cut to `max` characters, the last one `…` when it was cut. */
export const clip = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text;

/** Like `clip`, but cut at the last word boundary (no half words); a single long word is cut hard. */
export function clipWords(text: string, max: number): string {
  if (text.length <= max) return text;

  const head = text.slice(0, Math.max(0, max - 1));
  const space = text[head.length] === " " ? head.length : head.lastIndexOf(" ");
  const words = head.slice(0, Math.max(0, space)).replace(/[\s,;:.-]+$/, "");

  return `${words || head}…`;
}
