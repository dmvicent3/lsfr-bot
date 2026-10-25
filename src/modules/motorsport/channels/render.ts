import type { WeatherMap, PredictionCounts, SchedulePayload } from "./types.ts";
import { type APIButtonComponentWithCustomId, ButtonStyle, ComponentType } from "discord.js";
import { isPredictable } from "../predictions/predictions.ts";
import type { SeriesInfo } from "../types.ts";
import type { EventSchedule, Session } from "../types.ts";
import { formatWeather } from "../weather/weather.ts";
import { timestamp } from "../format.ts";

const MAX_CONTENT = 2000;

function sessionLine(s: Session, weather: WeatherMap, predictions: PredictionCounts): string {
  const forecast = weather.get(`${s.eventId}/${s.sessionId}`);
  const count = predictions.get(s.sessionId) ?? 0;
  const suffix = [
    ...(forecast ? [formatWeather(forecast)] : []),
    ...(count > 0 ? [`🔮 ${count} prediction${count === 1 ? "" : "s"}`] : []),
  ]
    .map((part) => ` · ${part}`)
    .join("");
  return `${s.pingable ? "🔔" : "▫️"} **${s.title}** · ${timestamp(s.start, "d")} ${timestamp(s.start, "t")} (${timestamp(s.start, "R")})${suffix}`;
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

const button = (customId: string, label: string): APIButtonComponentWithCustomId => ({
  type: ComponentType.Button,
  custom_id: customId,
  label,
  style: ButtonStyle.Secondary,
});

/** Season pings always; reminders and predictions when the event has sessions for them. */
function scheduleButtons(
  info: SeriesInfo,
  event: EventSchedule | null,
): APIButtonComponentWithCustomId[] {
  const buttons = [button(`motorsport:pings:${info.key}`, "🔔 Season pings")];
  if (!event) return buttons;
  if (event.sessions.some((s) => s.pingable)) {
    buttons.push(button(`motorsport:remindmenu:${info.key}:${event.eventId}`, "⏰ Remind me…"));
  }
  if (event.sessions.some((s) => isPredictable(info.key, s.sessionId))) {
    buttons.push(button(`motorsport:predictmenu:${info.key}:${event.eventId}`, "🔮 Predict"));
  }
  return buttons;
}

export function renderSchedule(
  info: SeriesInfo,
  event: EventSchedule | null,
  weather: WeatherMap = new Map(),
  predictions: PredictionCounts = new Map(),
): SchedulePayload {
  const components = [
    { type: ComponentType.ActionRow as const, components: scheduleButtons(info, event) },
  ];
  const content = event
    ? scheduleText(info, event, weather, predictions)
    : `## 🏁 ${info.name}\nNo upcoming events this season.`;
  return { content, components };
}
