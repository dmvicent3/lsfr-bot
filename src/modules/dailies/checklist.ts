import type { APIEmbed } from "discord.js";
import { untilNext } from "../../core/daily.ts";
import { mentionOf } from "../../core/mention.ts";
import type { DailyEntry, DailyState } from "./types.ts";

const EMBED_COLOR = 0x5865f2;

const MARK: Record<DailyState, string> = { done: "✅", started: "▶️", todo: "⬜" };

interface LineCtx {
  commandIds: ReadonlyMap<string, string>;
  now: number;
  /** Every game resets at the same time, so the footer says it once. */
  sharedReset: boolean;
}

function line(e: DailyEntry, c: LineCtx): string {
  const head = `${MARK[e.state]} **${e.label}**`;

  if (e.state === "done") return `${head} · ${e.result ?? ""}`;

  const parts = [head, ...(e.state === "started" ? ["started"] : [])];
  parts.push(mentionOf(e.command, c.commandIds));

  if (!c.sharedReset) parts.push(`resets in ${untilNext(c.now, e.tz)}`);

  return parts.join(" · ");
}

/** The player's checklist for today: one line per daily, done count in the title. */
export function checklist(
  name: string,
  entries: DailyEntry[],
  commandIds: ReadonlyMap<string, string>,
  now: number,
): APIEmbed {
  const finished = entries.filter((e) => e.state === "done").length;
  const zones = new Set(entries.map((e) => e.tz));
  const sharedReset = zones.size <= 1;
  const allDone = finished === entries.length ? " 🎉" : "";
  const [tz] = zones;

  return {
    title: `${name}'s dailies · ${finished}/${entries.length} done${allDone}`,
    color: EMBED_COLOR,
    description: entries.map((e) => line(e, { commandIds, now, sharedReset })).join("\n"),
    ...(sharedReset && tz ? { footer: { text: `Next reset in ${untilNext(now, tz)}` } } : {}),
  };
}
