import type { Forecast, Coords } from "./types.ts";
import { isRecord, isString } from "../../../core/guards.ts";
import type { Session } from "../types.ts";

/** Open-Meteo forecasts reach 16 days ahead. */
export const FORECAST_DAYS = 16;

export function forecastUrl({ lat, lon }: Coords): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=UTC&forecast_days=${FORECAST_DAYS}`;
}

/** [lowest WMO code, highest, emoji]: clear, fog, drizzle, rain, snow, thunderstorm. */
const WMO_EMOJI: readonly (readonly [number, number, string])[] = [
  [0, 0, "☀️"],
  [1, 2, "🌤️"],
  [3, 3, "☁️"],
  [45, 48, "🌫️"],
  [51, 57, "🌦️"],
  [61, 67, "🌧️"],
  [80, 82, "🌧️"],
  [71, 77, "🌨️"],
  [85, 86, "🌨️"],
  [95, Infinity, "⛈️"],
];

/** WMO weather code → emoji. */
export function weatherEmoji(code: number): string {
  return WMO_EMOJI.find(([lo, hi]) => code >= lo && code <= hi)?.[2] ?? "🌡️";
}

export function formatWeather(f: Forecast): string {
  return `${weatherEmoji(f.code)} ${Math.round(f.tempC)}°C 💧${f.rainChance}%`;
}

function numberAt(values: unknown, i: number): number | null {
  if (!Array.isArray(values)) return null;
  const value: unknown = values[i];
  return typeof value === "number" ? value : null;
}

/** The forecast for the UTC hour containing `at`, from an Open-Meteo hourly response. */
export function forecastAt(json: unknown, at: Date): Forecast | null {
  if (!isRecord(json) || !isRecord(json["hourly"])) return null;
  const hourly = json["hourly"];
  const times = hourly["time"];
  if (!Array.isArray(times)) return null;
  const hour = at.toISOString().slice(0, 13) + ":00";
  const i = times.indexOf(hour);
  if (i < 0) return null;
  const tempC = numberAt(hourly["temperature_2m"], i);
  const rainChance = numberAt(hourly["precipitation_probability"], i);
  const code = numberAt(hourly["weather_code"], i);
  if (tempC === null || rainChance === null || code === null) return null;
  return { tempC, rainChance, code };
}

const day = (d: Date): string => d.toISOString().slice(0, 10);

/** A sportstimes race as [race UTC date, coordinates]; none when either is missing. */
function raceCoords(race: unknown): [string, Coords][] {
  if (!isRecord(race) || !isRecord(race["sessions"])) return [];
  const gp = race["sessions"]["gp"];
  const lat = Number(race["latitude"]);
  const lon = Number(race["longitude"]);
  if (!isString(gp) || Number.isNaN(lat) || Number.isNaN(lon)) return [];
  return [[gp.slice(0, 10), { lat, lon }]];
}

/**
 * Tunous F1 data has no coordinates; sportstimes' F1 calendar does. Events are matched on
 * the race's UTC date.
 */
export function coordsByEvent(f1Sessions: Session[], sportstimesF1: unknown): Map<string, Coords> {
  const races = isRecord(sportstimesF1) ? sportstimesF1["races"] : undefined;
  const byRaceDay = new Map(Array.isArray(races) ? races.flatMap(raceCoords) : []);
  const coords = new Map<string, Coords>();
  for (const s of f1Sessions) {
    if (s.sessionId !== "race") continue;
    const match = byRaceDay.get(day(s.start));
    if (match) coords.set(s.eventId, match);
  }
  return coords;
}
