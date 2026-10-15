import { describe, expect, test } from "bun:test";
import { ComponentType } from "discord.js";
import { renderPing, renderSchedule } from "./render.ts";
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
    expect(lines.some((l) => l.startsWith("▫️ **Practice 1** — <t:"))).toBe(true);
    expect(lines.some((l) => l.startsWith("🔔 **Race** — <t:"))).toBe(true);
    expect(lines.at(-1)).toBe("-# 🔔 = pinged");
  });

  test("has a season-pings button and a remind select of pingable sessions", () => {
    const { components } = renderSchedule(f1, event);
    expect(components).toHaveLength(2);
    const button = components[0]?.components[0];
    expect(button?.type).toBe(ComponentType.Button);
    expect(button && "custom_id" in button ? button.custom_id : "").toBe("motorsport:pings:f1");
    const select = components[1]?.components[0];
    if (select?.type !== ComponentType.StringSelect) throw new Error("expected a string select");
    expect(select.custom_id).toBe("motorsport:remind:f1:chinese-grand-prix");
    expect(select.options.map((o) => o.value)).toEqual(["race"]);
  });

  test("no select when nothing in the event is pinged", () => {
    const quiet = { ...event, sessions: [fp1] };
    expect(renderSchedule(f1, quiet).components).toHaveLength(1);
  });

  test("off-season", () => {
    const rendered = renderSchedule(f1, null);
    expect(rendered.content).toContain("No upcoming events this season.");
    expect(rendered.components).toHaveLength(1);
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
