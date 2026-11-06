import { flag } from "../../../core/countries/flag.ts";
import { levelOf } from "../engine/constellation.ts";
import { TIERS } from "../engine/types.ts";
import type { Roster } from "../types.ts";
import { clampPage, plural } from "./format.ts";

export const COLLECTION_PAGE = 36;

interface Held {
  name: string;
  country: string;
  tier: number;
  level: number;
}

/** Rarest first, then the highest level, then by name. */
function held(roster: Roster, copies: ReadonlyMap<string, number>): Held[] {
  return [...copies]
    .flatMap(([id, n]) => {
      const d = roster.byId.get(id);

      return d ? [{ name: d.name, country: d.country, tier: d.tier, level: levelOf(n) }] : [];
    })
    .toSorted((a, b) => b.tier - a.tier || b.level - a.level || a.name.localeCompare(b.name));
}

/** "★5 3/34 · ★4 10/81 · ★3 50/660" */
function completion(roster: Roster, list: readonly Held[]): string {
  return TIERS.map(
    (t) => `★${t} ${list.filter((h) => h.tier === t).length}/${roster.pools[t].length}`,
  ).join(" · ");
}

/** /gacha collection: completion per tier, then one page of owned drivers grouped by tier. */
export function collectionText(v: {
  name: string;
  roster: Roster;
  copies: ReadonlyMap<string, number>;
  page: number;
}): string {
  const list = held(v.roster, v.copies);
  const head = `**${v.name}'s collection** · ${completion(v.roster, list)}`;

  if (list.length === 0) return `${head}\nNo drivers yet. Try \`/gacha pull\`.`;

  const pages = Math.ceil(list.length / COLLECTION_PAGE);
  const page = clampPage(v.page, list.length, COLLECTION_PAGE);
  const shown = list.slice((page - 1) * COLLECTION_PAGE, page * COLLECTION_PAGE);
  const lines = TIERS.flatMap((t) => {
    const of = shown.filter((h) => h.tier === t);

    return of.length > 0
      ? [`**★${t}** ${of.map((h) => `${flag(h.country)} ${h.name} C${h.level}`).join(" · ")}`]
      : [];
  });
  const foot = pages > 1 ? [`Page ${page}/${pages} · ${plural(list.length, "driver")}`] : [];

  return [head, ...lines, ...foot].join("\n");
}
