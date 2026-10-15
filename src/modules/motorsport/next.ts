import type { APIEmbed } from "discord.js";
import { SERIES } from "./series.ts";
import type { SeriesKey, Session } from "./types.ts";

const EMBED_COLOR = 0xe10600;

interface Upcoming {
  name: string;
  session: Session;
  live: boolean;
  channelId: string | undefined;
}

/** The live or next pinged session of one series, or null when the season is over. */
function upcomingOf(sessions: Session[], now: number): { session: Session; live: boolean } | null {
  const pinged = sessions
    .filter((s) => s.pingable)
    .toSorted((a, b) => a.start.getTime() - b.start.getTime());
  const live = pinged.find((s) => s.start.getTime() <= now && now < s.end.getTime());
  if (live) return { session: live, live: true };
  const next = pinged.find((s) => s.start.getTime() > now);
  return next ? { session: next, live: false } : null;
}

function line(u: Upcoming): string {
  const { title, eventName, start } = u.session;
  if (u.live) return `🔴 **${u.name}** · ${title} · ${eventName} · **LIVE now**`;
  const t = Math.floor(start.getTime() / 1000);
  const channel = u.channelId ? ` · <#${u.channelId}>` : "";
  return `🏁 **${u.name}** · ${title} · ${eventName} · <t:${t}:R> (<t:${t}:f>)${channel}`;
}

/** `/motorsport next`: every series' live or next pinged session, live first, then soonest. */
export function renderNext(
  sessionsBySeries: ReadonlyMap<SeriesKey, Session[]>,
  followedChannels: ReadonlyMap<SeriesKey, string>,
  now: number,
): APIEmbed {
  const upcoming: Upcoming[] = [];
  for (const info of SERIES) {
    const found = upcomingOf(sessionsBySeries.get(info.key) ?? [], now);
    if (found)
      upcoming.push({ name: info.name, ...found, channelId: followedChannels.get(info.key) });
  }
  upcoming.sort(
    (a, b) =>
      Number(b.live) - Number(a.live) || a.session.start.getTime() - b.session.start.getTime(),
  );
  return {
    title: "Next sessions",
    color: EMBED_COLOR,
    description: upcoming.length > 0 ? upcoming.map(line).join("\n") : "No upcoming sessions.",
  };
}
