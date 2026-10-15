import {
  type APIActionRowComponent,
  type APIComponentInMessageActionRow,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import type { SeriesInfo } from "./series.ts";
import type { EventSchedule, Session } from "./types.ts";

export interface SchedulePayload {
  content: string;
  components: APIActionRowComponent<APIComponentInMessageActionRow>[];
}

const MAX_SELECT_OPTIONS = 25;

const MAX_CONTENT = 2000;

function unix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function sessionLine(s: Session): string {
  const t = unix(s.start);
  return `${s.pingable ? "🔔" : "▫️"} **${s.title}** — <t:${t}:F> (<t:${t}:R>)`;
}

/**
 * The full schedule when it fits in one message. Otherwise (e.g. a WRC rally with 30+
 * stages) only the pinged sessions are listed and the rest are counted.
 */
function scheduleText(info: SeriesInfo, event: EventSchedule): string {
  const header = `## 🏁 ${info.name} — ${event.eventName}`;
  const footer = "-# 🔔 = pinged";
  const full = [header, ...event.sessions.map(sessionLine), footer].join("\n");
  if (full.length <= MAX_CONTENT) return full;
  const pinged = event.sessions.filter((s) => s.pingable);
  const hidden = event.sessions.length - pinged.length;
  const short = [header, ...pinged.map(sessionLine), `▫️ …and ${hidden} other sessions`, footer];
  return short.join("\n").slice(0, MAX_CONTENT);
}

export function renderSchedule(info: SeriesInfo, event: EventSchedule | null): SchedulePayload {
  const pingsRow: APIActionRowComponent<APIComponentInMessageActionRow> = {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.Button,
        custom_id: `motorsport:pings:${info.key}`,
        label: "🔔 Season pings",
        style: ButtonStyle.Secondary,
      },
    ],
  };
  if (!event) {
    return {
      content: `## 🏁 ${info.name}\nNo upcoming events this season.`,
      components: [pingsRow],
    };
  }

  const content = scheduleText(info, event);

  const pingable = event.sessions.filter((s) => s.pingable).slice(0, MAX_SELECT_OPTIONS);
  if (pingable.length === 0) return { content, components: [pingsRow] };
  const remindRow: APIActionRowComponent<APIComponentInMessageActionRow> = {
    type: ComponentType.ActionRow,
    components: [
      {
        type: ComponentType.StringSelect,
        custom_id: `motorsport:remind:${info.key}:${event.eventId}`,
        placeholder: "Remind me about…",
        min_values: 1,
        max_values: 1,
        options: pingable.map((s) => ({ label: s.title, value: s.sessionId })),
      },
    ],
  };
  return { content, components: [pingsRow, remindRow] };
}

export interface PingInput {
  info: SeriesInfo;
  session: Session;
  roleId: string;
  roleHasMembers: boolean;
  roleMemberIds: ReadonlySet<string>;
  oneOffUserIds: string[];
}

export interface PingPayload {
  content: string;
  allowedMentions: { roles: string[]; users: string[] };
}

export function renderPing(p: PingInput): PingPayload | null {
  const users = p.oneOffUserIds.filter((id) => !p.roleMemberIds.has(id));
  const roles = p.roleHasMembers ? [p.roleId] : [];
  if (roles.length === 0 && users.length === 0) return null;
  const mentions = [...roles.map((id) => `<@&${id}>`), ...users.map((id) => `<@${id}>`)];
  const { eventName, title, start } = p.session;
  return {
    content: `${mentions.join(" ")} 🏁 ${eventName} ${title} starts <t:${unix(start)}:R>`,
    allowedMentions: { roles, users },
  };
}
