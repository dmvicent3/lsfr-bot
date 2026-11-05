import type { Category } from "../../src/modules/groups/types.ts";
import { type Draft, draftOf, strays } from "./category.ts";
import { levelled } from "./level.ts";
import { type Lexicon, membersOf, synsetOf } from "./members.ts";
import type { NounNet, Pick } from "./types.ts";

/** What a build left out, for the build log. */
export interface Skipped {
  id: string;
  why: string;
}

function whyNot(found: boolean, stray: string[]): string {
  if (!found) return "no such synset";

  return stray.length > 0 ? `not members: ${stray.join(" ")}` : "too few words";
}

/** The bank: every allowlisted synset with enough playable words, levelled; and what was skipped. */
export function buildBank(
  net: NounNet,
  lex: Lexicon,
  picks: Pick[],
): { bank: Category[]; skipped: Skipped[] } {
  const drafts: Draft[] = [];
  const skipped: Skipped[] = [];

  for (const p of picks) {
    const root = synsetOf(net, p.id);
    const stray = root ? strays(p, membersOf(net, root, lex)) : [];
    const draft = root && stray.length === 0 ? draftOf(p, membersOf(net, root, lex)) : null;

    if (draft) drafts.push(draft);
    else skipped.push({ id: p.id, why: whyNot(root !== null, stray) });
  }

  return { bank: levelled(drafts), skipped };
}
