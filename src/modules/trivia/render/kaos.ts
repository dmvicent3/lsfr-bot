import type { APIEmbed } from "discord.js";
import type { KaosRound } from "../rounds/types.ts";
import { KAOS_POINTS } from "../scoring.ts";

/** One line per item: who claimed it, the hint's first letter, or (after the close) the miss. */
function itemLine(r: KaosRound, names: ReadonlyMap<string, string>, i: number): string {
  const answer = r.list.items[i]?.answer ?? "";
  const claim = r.claims[i];

  if (claim) return `${i + 1}. ${answer} — ${names.get(claim.userId) ?? "someone"}`;

  if (r.closedAt !== null) return `${i + 1}. ${answer} (missed)`;

  return r.hinted ? `${i + 1}. ${answer.charAt(0)}…` : `${i + 1}. ?`;
}

export function kaosMessage(
  r: KaosRound,
  names: ReadonlyMap<string, string>,
): { embeds: APIEmbed[] } {
  const count = r.list.items.length;
  const title = `#${r.list.id} KAOS · ${r.list.prompt} (${count} answers) · ${KAOS_POINTS} pts each`;
  const description = r.list.items.map((_, i) => itemLine(r, names, i)).join("\n");

  return { embeds: [{ title, description }] };
}
