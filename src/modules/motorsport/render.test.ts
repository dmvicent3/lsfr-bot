import { describe, expect, test } from "bun:test";
import { ComponentType } from "discord.js";
import { renderPing, renderReminderPicker, renderSchedule } from "./render.ts";
import { seriesInfo } from "./series.ts";
import type { EventSchedule, Session } from "./types.ts";

const T = Date.parse("2026-03-13T03:30:00Z");

function session(sessionId: string, title: string, pingable: boolean, offsetH: number): Session {
  return {
    series: "f1",
    eventId: "chinese-grand-prix",
    eventName: "Chinese Grand Prix",
    sessionId,
    title,
    start: new Date(T + offsetH * 3_600_000),
    end: new Date(T + (offsetH + 1) * 3_600_000),
    pingable,
  };
}

const f1 = seriesInfo("f1");
const fp1 = session("practice-1", "Practice 1", false, 0);
const race = session("race", "Race", true, 48);
const event: EventSchedule = {
  eventId: "chinese-grand-prix",
  eventName: "Chinese Grand Prix",
  sessions: [fp1, race],
};

describe("renderSchedule", () => {
  test("lists sessions, marking pinged ones", () => {
    const { content } = renderSchedule(f1, event);
    const lines = content.split("\n");
    expect(lines[0]).toBe("## 🏁 F1 — Chinese Grand Prix");
    expect(lines.some((l) => l.startsWith("▫️ **Practice 1** · <t:"))).toBe(true);
    expect(lines.some((l) => l.startsWith("🔔 **Race** · <t:"))).toBe(true);
    expect(lines.some((l) => /^🔔 \*\*Race\*\* · <t:\d+:d> <t:\d+:t> \(<t:\d+:R>\)$/.test(l))).toBe(
      true,
    );
    expect(lines.at(-1)?.startsWith("🔔 **Race**")).toBe(true);
  });

  test("has season-pings and remind-me buttons", () => {
    const { components } = renderSchedule(f1, event);
    expect(components).toHaveLength(1);
    const ids = (components[0]?.components ?? []).map((c) => ("custom_id" in c ? c.custom_id : ""));
    expect(ids).toEqual(["motorsport:pings:f1", "motorsport:remindmenu:f1:chinese-grand-prix"]);
  });

  test("no remind button when nothing in the event is pinged", () => {
    const quiet = { ...event, sessions: [fp1] };
    expect(renderSchedule(f1, quiet).components[0]?.components).toHaveLength(1);
  });

  test("off-season", () => {
    const rendered = renderSchedule(f1, null);
    expect(rendered.content).toContain("No upcoming events this season.");
    expect(rendered.components[0]?.components).toHaveLength(1);
  });
});

describe("renderPing", () => {
  test("role ping skips one-off users who already have the role", () => {
    const ping = renderPing({
      info: f1,
      session: race,
      roleId: "r1",
      roleHasMembers: true,
      roleMemberIds: new Set(["u1"]),
      oneOffUserIds: ["u1"],
    });
    expect(ping?.content.startsWith("<@&r1> 🏁")).toBe(true);
    expect(ping?.content).not.toContain("<@u1>");
    expect(ping?.allowedMentions).toEqual({ roles: ["r1"], users: [] });
  });

  test("only one-off users when the role is empty", () => {
    const ping = renderPing({
      info: f1,
      session: race,
      roleId: "r1",
      roleHasMembers: false,
      roleMemberIds: new Set(),
      oneOffUserIds: ["u2"],
    });
    expect(ping?.content.startsWith("<@u2> 🏁 Chinese Grand Prix Race starts <t:")).toBe(true);
    expect(ping?.allowedMentions.roles).toEqual([]);
  });

  test("nobody to ping", () => {
    const ping = renderPing({
      info: f1,
      session: race,
      roleId: "r1",
      roleHasMembers: false,
      roleMemberIds: new Set(),
      oneOffUserIds: [],
    });
    expect(ping).toBeNull();
  });
});

test("every fixture event's schedule fits in one Discord message", async () => {
  const { parseTunous } = await import("./sources/tunous.ts");
  const { parseSportstimes } = await import("./sources/sportstimes.ts");
  const { fixture } = await import("./sources/testing.ts");
  const { applyRules } = await import("./rules.ts");
  const { groupEvents } = await import("./decisions.ts");
  const parsed = [
    ...parseTunous("f1", 2026, await fixture("tunous-formula1")),
    ...parseTunous("wec", 2026, await fixture("tunous-wec")),
    ...parseTunous("wrc", 2026, await fixture("tunous-wrc")),
    ...parseSportstimes("motogp", 2026, await fixture("st-motogp")),
    ...parseSportstimes("indycar", 2026, await fixture("st-indycar")),
  ];
  for (const ev of groupEvents(applyRules(parsed))) {
    const info = seriesInfo(ev.sessions[0]?.series ?? "f1");
    const { content } = renderSchedule(info, ev);
    expect(content.length).toBeLessThanOrEqual(2000);
    for (const s of ev.sessions.filter((x) => x.pingable)) {
      expect(content).toContain(`**${s.title}**`);
    }
  }
});

describe("renderReminderPicker", () => {
  const qual = session("qualifying", "Qualifying", true, 24);
  const picker = { ...event, sessions: [fp1, qual, race] };

  test("multi-select of upcoming pinged sessions with the user's picks ticked", () => {
    const { content, components } = renderReminderPicker(f1, picker, new Set(["race"]), T);
    expect(content).toContain("Chinese Grand Prix");
    const select = components[0]?.components[0];
    if (select?.type !== ComponentType.StringSelect) throw new Error("expected a string select");
    expect(select.custom_id).toBe("motorsport:reminders:f1:chinese-grand-prix");
    expect(select.min_values).toBe(0);
    expect(select.max_values).toBe(2);
    expect(select.options.map((o) => [o.value, o.default ?? false])).toEqual([
      ["qualifying", false],
      ["race", true],
    ]);
  });

  test("nothing left to remind about", () => {
    const rendered = renderReminderPicker(f1, picker, new Set(), T + 100 * 3_600_000);
    expect(rendered.content).toBe("No upcoming sessions to remind about.");
    expect(rendered.components).toEqual([]);
  });
});

test("session lines carry the forecast when there is one", () => {
  const weather = new Map([["chinese-grand-prix/race", { tempC: 20, rainChance: 10, code: 1 }]]);
  const { content } = renderSchedule(f1, event, weather);
  const raceLine = content.split("\n").find((l) => l.startsWith("🔔 **Race**")) ?? "";
  expect(raceLine.endsWith(" · 🌤️ 20°C 💧10%")).toBe(true);
  const fpLine = content.split("\n").find((l) => l.startsWith("▫️ **Practice 1**")) ?? "";
  expect(fpLine).not.toContain("💧");
});
