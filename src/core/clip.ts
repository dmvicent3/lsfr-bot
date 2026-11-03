/** `text` cut to `max` characters, the last one `…` when it was cut. */
export const clip = (text: string, max: number): string =>
  text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text;
