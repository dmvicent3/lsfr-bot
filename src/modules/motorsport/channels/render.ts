import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  type APIComponentInMessageActionRow,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { isPredictable } from "../predictions/predictions.ts";
import type { SeriesInfo } from "../series.ts";
import type { EventSchedule, Session } from "../types.ts";
import { type Forecast, formatWeather } from "../weather/weather.ts";

/** Forecasts keyed by `eventId/sessionId`. */
export type WeatherMap = ReadonlyMap<string, Forecast>;

/** Complete predictions per session id of the shown event. */
export type PredictionCounts = ReadonlyMap<string, number>;

export interface SchedulePayload {
  content: string;
  components: APIActionRowComponent<APIComponentInMessageActionRow>[];
}

const MAX_SELECT_OPTIONS = 25;

const MAX_CONTENT = 2000;

function unix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function sessionLine(s: Session, weather: WeatherMap, predictions: PredictionCounts): string {
  const t = unix(s.start);
  const forecast = weather.get(`${s.eventId}/${s.sessionId}`);
  const count = predictions.get(s.sessionId) ?? 0;
  const suffix = [
    ...(forecast ? [formatWeather(forecast)] : []),
    ...(count > 0 ? [`🔮 ${count} prediction${count === 1 ? "" : "s"}`] : []),
  ]
    .map((part) => ` · ${part}`)
    .join("");
  return `${s.pingable ? "🔔" : "▫️"} **${s.title}** · <t:${t}:d> <t:${t}:t> (<t:${t}:R>)${suffix}`;
}

/**
 * The full schedule when it fits in one message. Otherwise (e.g. a WRC rally with 30+
 * stages) only the pinged sessions are listed and the rest are counted.
 */
function scheduleText(
  info: SeriesInfo,
  event: EventSchedule,
  weather: WeatherMap,
  predictions: PredictionCounts,
): string {
  const line = (s: Session): string => sessionLine(s, weather, predictions);
  const header = `## 🏁 ${info.name} — ${event.eventName}`;
  const full = [header, ...event.sessions.map(line)].join("\n");
  if (full.length <= MAX_CONTENT) return full;
  const pinged = event.sessions.filter((s) => s.pingable);
  const hidden = event.sessions.length - pinged.length;
  const short = [header, ...pinged.map(line), `▫️ …and ${hidden} other sessions`];
  return short.join("\n").slice(0, MAX_CONTENT);
}

export function renderSchedule(
  info: SeriesInfo,
  event: EventSchedule | null,
  weather: WeatherMap = new Map(),
  predictions: PredictionCounts = new Map(),
): SchedulePayload {
  const buttons: APIButtonComponentWithCustomId[] = [
    {
      type: ComponentType.Button,
      custom_id: `motorsport:pings:${info.key}`,
      label: "🔔 Season pings",
      style: ButtonStyle.Secondary,
    },
  ];
  if (event?.sessions.some((s) => s.pingable)) {
    buttons.push({
      type: ComponentType.Button,
      custom_id: `motorsport:remindmenu:${info.key}:${event.eventId}`,
      label: "⏰ Remind me…",
      style: ButtonStyle.Secondary,
    });
  }
  if (event?.sessions.some((s) => isPredictable(info.key, s.sessionId))) {
    buttons.push({
      type: ComponentType.Button,
      custom_id: `motorsport:predictmenu:${info.key}:${event.eventId}`,
      label: "🔮 Predict",
      style: ButtonStyle.Secondary,
    });
  }
  const components = [{ type: ComponentType.ActionRow as const, components: buttons }];
  const content = event
    ? scheduleText(info, event, weather, predictions)
    : `## 🏁 ${info.name}\nNo upcoming events this season.`;
  return { content, components };
}

/**
 * The private picker opened by "Remind me…": a multi-select of the event's upcoming pinged
 * sessions with the viewer's current reminders ticked. Submitting sets exactly that selection.
 */
export function renderReminderPicker(
  info: SeriesInfo,
  event: EventSchedule,
  selected: ReadonlySet<string>,
  now: number,
): SchedulePayload {
  const upcoming = event.sessions
    .filter((s) => s.pingable && s.start.getTime() > now)
    .slice(0, MAX_SELECT_OPTIONS);
  if (upcoming.length === 0) {
    return { content: "No upcoming sessions to remind about.", components: [] };
  }
  return {
    content: `Pick the ${info.name} ${event.eventName} sessions to ping you about (this weekend only):`,
    components: [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect,
            custom_id: `motorsport:reminders:${info.key}:${event.eventId}`,
            placeholder: "No reminders",
            min_values: 0,
            max_values: upcoming.length,
            options: upcoming.map((s) => ({
              label: s.title,
              value: s.sessionId,
              description: s.start.toUTCString().slice(0, 22) + " UTC",
              default: selected.has(s.sessionId),
            })),
          },
        ],
      },
    ],
  };
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
