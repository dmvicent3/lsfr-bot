import type { Pick } from "./types.ts";

/**
 * One allowlist line, `lemma.n.N | Name | spec`: the spec lists words to drop; `+word` adds a
 * word, `!N` fixes the level. Null for blank and `#` comment lines.
 */
export function parsePick(line: string): Pick | null {
  if (line.trim() === "" || line.startsWith("#")) return null;

  const [id = "", name = "", spec = ""] = line.split("|").map((p) => p.trim());

  if (!/^.+\.n\.\d+$/.test(id) || name === "") throw new Error(`bad allowlist line: ${line}`);

  return { id, name, ...extras(spec) };
}

/** The drops, adds and level of a spec, each only when given. */
function extras(spec: string): Omit<Pick, "id" | "name"> {
  const tokens = spec.split(/\s+/).filter(Boolean);
  const drop = tokens.filter((t) => /^[a-z]+$/.test(t));
  const add = tokens.filter((t) => t.startsWith("+")).map((t) => t.slice(1));
  const level = tokens.find((t) => t.startsWith("!"));

  return {
    ...(drop.length > 0 ? { drop } : {}),
    ...(add.length > 0 ? { add } : {}),
    ...(level ? { level: Number(level.slice(1)) } : {}),
  };
}

export const parseAllowlist = (text: string): Pick[] =>
  text.split(/\r?\n/).flatMap((line) => parsePick(line) ?? []);
