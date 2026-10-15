import { isRecord, isString } from "../../core/guards.ts";
import type { Session } from "./types.ts";

export interface Forecast {
  tempC: number;
  /** Precipitation probability, 0–100. */
  rainChance: number;
  /** WMO weather code. */
  code: number;
}

export interface Coords {
  lat: number;
  lon: number;
}

/** Open-Meteo forecasts reach 16 days ahead. */
export const FORECAST_DAYS = 16;

export function forecastUrl({ lat, lon }: Coords): string {
  return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation_probability,weather_code&timezone=UTC&forecast_days=${FORECAST_DAYS}`;
}

/** WMO weather code → emoji. */
export function weatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫️";
  if (code >= 51 && code <= 57) return "🌦️";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "🌧️";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "🌨️";
  if (code >= 95) return "⛈️";
  return "🌡️";
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

/**
 * Tunous F1 data has no coordinates; sportstimes' F1 calendar does. Events are matched on
 * the race's UTC date.
 */
export function coordsByEvent(f1Sessions: Session[], sportstimesF1: unknown): Map<string, Coords> {
  const byRaceDay = new Map<string, Coords>();
  if (isRecord(sportstimesF1) && Array.isArray(sportstimesF1["races"])) {
    for (const race of sportstimesF1["races"] as unknown[]) {
      if (!isRecord(race) || !isRecord(race["sessions"])) continue;
      const gp = race["sessions"]["gp"];
      const lat = Number(race["latitude"]);
      const lon = Number(race["longitude"]);
      if (!isString(gp) || Number.isNaN(lat) || Number.isNaN(lon)) continue;
      byRaceDay.set(gp.slice(0, 10), { lat, lon });
    }
  }
  const coords = new Map<string, Coords>();
  for (const s of f1Sessions) {
    if (s.sessionId !== "race") continue;
    const match = byRaceDay.get(day(s.start));
    if (match) coords.set(s.eventId, match);
  }
  return coords;
}
