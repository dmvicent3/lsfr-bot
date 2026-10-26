import type { RefreshResult, UpcomingEvent } from "./types.ts";
import type { FetchFn } from "../../../core/types.ts";
import { log } from "../../../core/log.ts";
import type { MotorsportRepo } from "../repo.ts";
import { applyRules } from "../pings/rules.ts";
import { SERIES } from "../series.ts";
import { fetchSeries, getJson } from "./sources/fetch.ts";
import { coordsByEvent, FORECAST_DAYS, forecastAt, forecastUrl } from "../weather/weather.ts";
import type { Coords, Forecast, WeatherRow } from "../weather/types.ts";
import type { Session } from "../types.ts";

/**
 * Fetches this year's and next year's schedule for every series. A series whose fetch or
 * parse fails keeps its previous sessions.
 */
export async function refreshAll(
  repo: MotorsportRepo,
  now: Date,
  fetchFn: FetchFn = fetch,
): Promise<RefreshResult[]> {
  const year = now.getUTCFullYear();

  return Promise.all(
    SERIES.map(async (info): Promise<RefreshResult> => {
      try {
        const [current, next] = await Promise.all([
          fetchSeries(info, year, fetchFn),
          fetchSeries(info, year + 1, fetchFn),
        ]);

        // Next year 404s until it's published; this year missing means the source broke.
        if (current.length === 0) throw new Error(`no ${year} schedule`);

        repo.sessions.replace(info.key, applyRules([...current, ...next]), now.getTime());

        return { series: info.key, ok: true };
      } catch (err) {
        log.error("motorsport:refresh", `${info.key} failed, keeping previous schedule`, err);

        return { series: info.key, ok: false, error: String(err) };
      }
    }),
  );
}

const DAY_MS = 86_400_000;

async function requireJson(url: string, fetchFn: FetchFn): Promise<unknown> {
  const json = await getJson(url, fetchFn);

  if (json === null) throw new Error(`${url} returned 404`);

  return json;
}

/**
 * Forecasts for F1 sessions in the next 16 days (the Open-Meteo range). Coordinates come from
 * the sportstimes F1 calendar for the current year; F1 never races across New Year. Any
 * failure keeps the previously stored weather.
 */
export async function refreshWeather(
  repo: MotorsportRepo,
  now: Date,
  fetchFn: FetchFn = fetch,
): Promise<void> {
  try {
    const t = now.getTime();
    const sessions = repo.sessions.list("f1");
    const calendar = await requireJson(
      `https://raw.githubusercontent.com/sportstimes/f1/main/_db/f1/${now.getUTCFullYear()}.json`,
      fetchFn,
    );
    const coords = coordsByEvent(sessions, calendar);
    const previous = repo.weather.bySession("f1");
    const rows: WeatherRow[] = [];

    for (const event of upcomingEvents(sessions, t)) {
      const where = coords.get(event.eventId);

      if (where) rows.push(...(await eventWeather(event, where, previous, fetchFn)));
    }

    repo.weather.replace("f1", rows, t);
  } catch (err) {
    log.error("motorsport:weather", "forecast refresh failed, keeping previous weather", err);
  }
}

/** Sessions starting within the forecast range, grouped by event. */
function upcomingEvents(sessions: Session[], t: number): UpcomingEvent[] {
  const upcoming = sessions.filter(
    (s) => s.start.getTime() > t && s.start.getTime() <= t + FORECAST_DAYS * DAY_MS,
  );

  return [...new Set(upcoming.map((s) => s.eventId))].map((eventId) => ({
    eventId,
    sessions: upcoming.filter((s) => s.eventId === eventId),
  }));
}

/** One event's session forecasts; when the forecast fetch fails, its previous ones. */
async function eventWeather(
  { eventId, sessions }: UpcomingEvent,
  where: Coords,
  previous: Map<string, Forecast>,
  fetchFn: FetchFn,
): Promise<WeatherRow[]> {
  let json: unknown;

  try {
    json = await requireJson(forecastUrl(where), fetchFn);
  } catch (err) {
    log.error("motorsport:weather", `${eventId} failed, keeping its previous weather`, err);

    return rowsOf(eventId, sessions, (s) => previous.get(`${eventId}/${s.sessionId}`));
  }

  return rowsOf(eventId, sessions, (s) => forecastAt(json, s.start));
}

function rowsOf(
  eventId: string,
  sessions: Session[],
  forecastOf: (s: Session) => Forecast | null | undefined,
): WeatherRow[] {
  return sessions.flatMap((s) => {
    const forecast = forecastOf(s);

    return forecast ? [{ eventId, sessionId: s.sessionId, forecast }] : [];
  });
}
