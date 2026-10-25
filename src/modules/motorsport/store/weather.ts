import type { SeriesKey } from "../types.ts";
import type { Forecast, WeatherRow } from "../weather/types.ts";
import type { Database } from "bun:sqlite";

/** motorsport_weather: the latest forecast per session. */
export class WeatherStore {
  constructor(private readonly db: Database) {}

  replace(s: SeriesKey, rows: WeatherRow[], fetchedAt: number): void {
    this.db.transaction(() => {
      this.db.run("DELETE FROM motorsport_weather WHERE series = ?", [s]);
      for (const { eventId, sessionId, forecast } of rows) {
        this.db.run(
          `INSERT OR REPLACE INTO motorsport_weather
            (series, event_id, session_id, temp_c, rain_chance, code, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [s, eventId, sessionId, forecast.tempC, forecast.rainChance, forecast.code, fetchedAt],
        );
      }
    })();
  }

  /** Forecasts keyed by `eventId/sessionId`. */
  bySession(s: SeriesKey): Map<string, Forecast> {
    const rows = this.db
      .query<
        { event_id: string; session_id: string; temp_c: number; rain_chance: number; code: number },
        [string]
      >(
        "SELECT event_id, session_id, temp_c, rain_chance, code FROM motorsport_weather WHERE series = ?",
      )
      .all(s);
    return new Map(
      rows.map((r) => [
        `${r.event_id}/${r.session_id}`,
        { tempC: r.temp_c, rainChance: r.rain_chance, code: r.code },
      ]),
    );
  }
}
