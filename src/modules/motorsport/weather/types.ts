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

/** One session's stored forecast. */
export interface WeatherRow {
  eventId: string;
  sessionId: string;
  forecast: Forecast;
}
