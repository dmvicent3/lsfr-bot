import { lcg } from "../../../core/random.ts";

/** FNV-1a 32-bit over the UTF-16 code units: the same on every run and platform. */
function hash(text: string): number {
  let h = 0x811c9dc5;

  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  }

  return h;
}

/** The day's random(), seeded from the guild and date. */
export function seedFor(guildId: string, date: string): () => number {
  return lcg(hash(`${guildId}:${date}`));
}
