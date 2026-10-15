import { expect, test } from "bun:test";
import { renderNext } from "./next.ts";
import type { SeriesKey, Session } from "./types.ts";

const NOW = Date.parse("2026-03-14T06:00:00Z");
const H = 3_600_000;

function session(
  series: SeriesKey,
  title: string,
  startOffsetH: number,
  pingable = true,
  eventName = "Chinese Grand Prix",
): Session {
  return {
    series,
    eventId: "e",
    eventName,
    sessionId: title.toLowerCase(),
    title,
    start: new Date(NOW + startOffsetH * H),
    end: new Date(NOW + (startOffsetH + 1) * H),
    pingable,
  };
}

const unix = (offsetH: number): number => Math.floor((NOW + offsetH * H) / 1000);

test("one line per series, soonest first, live on top, practice skipped", () => {
  const sessions = new Map<SeriesKey, Session[]>([
    ["f1", [session("f1", "Practice 1", 1, false), session("f1", "Qualifying", 5)]],
    ["motogp", [session("motogp", "Race", -0.5, true, "Thailand")]],
    ["wec", [session("wec", "Race", 48, true, "6 Hours of Imola")]],
    ["f2", [session("f2", "Feature Race", -100)]],
  ]);
  const embed = renderNext(sessions, new Map([["f1", "c1"]]), NOW);
  expect(embed.title).toBe("Next sessions");
  expect((embed.description ?? "").split("\n")).toEqual([
    "🔴 **MotoGP** · Race · Thailand · **LIVE now**",
    `🏁 **F1** · Qualifying · Chinese Grand Prix · <t:${unix(5)}:R> (<t:${unix(5)}:f>) · <#c1>`,
    `🏁 **WEC** · Race · 6 Hours of Imola · <t:${unix(48)}:R> (<t:${unix(48)}:f>)`,
  ]);
});

test("nothing upcoming", () => {
  expect(renderNext(new Map(), new Map(), NOW).description).toBe("No upcoming sessions.");
});
