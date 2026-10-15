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

function unix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
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

  const lines = event.sessions.map((s) => {
    const t = unix(s.start);
    return `${s.pingable ? "🔔" : "▫️"} **${s.title}** — <t:${t}:F> (<t:${t}:R>)`;
  });
  const content = [`## 🏁 ${info.name} — ${event.eventName}`, ...lines, "-# 🔔 = pinged"].join(
    "\n",
  );

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
