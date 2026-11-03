/** A WordNet gloss is the definition, then `;`-separated extras and quoted examples. */
export const glossOf = (raw: string): string => (raw.split(/[;"]/)[0] ?? "").trim();
