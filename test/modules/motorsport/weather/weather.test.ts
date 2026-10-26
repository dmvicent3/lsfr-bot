import { describe, expect, test } from "bun:test";
import { applyRules } from "../../../../src/modules/motorsport/pings/rules.ts";
import { fixture } from "../testing/fixtures.ts";
import { parseTunous } from "../../../../src/modules/motorsport/schedule/sources/tunous.ts";
import {
  coordsByEvent,
  forecastAt,
  formatWeather,
  forecastUrl,
  weatherEmoji,
} from "../../../../src/modules/motorsport/weather/weather.ts";

describe("weatherEmoji", () => {
  const cases: [number, string][] = [
    [0, "☀️"],
    [2, "🌤️"],
    [3, "☁️"],
    [45, "🌫️"],
    [53, "🌦️"],
    [63, "🌧️"],
    [81, "🌧️"],
    [73, "🌨️"],
    [95, "⛈️"],
  ];

  for (const [code, emoji] of cases)
    test(`${code} → ${emoji}`, () => expect(weatherEmoji(code)).toBe(emoji));
});

describe("forecastAt", () => {
  test("picks the hour the session starts in", async () => {
    const json = await fixture("open-meteo");
    expect(forecastAt(json, new Date("2026-10-15T07:30:00Z"))).toEqual({
      tempC: 22.5,
      rainChance: 0,
      code: 3,
    });
  });

  test("null outside the forecast or for junk", async () => {
    expect(forecastAt(await fixture("open-meteo"), new Date("2027-01-01T00:00:00Z"))).toBeNull();
    expect(forecastAt({ nope: true }, new Date("2026-10-15T07:00:00Z"))).toBeNull();
  });
});

test("formatWeather", () => {
  expect(formatWeather({ tempC: 21.6, rainChance: 30, code: 2 })).toBe("🌤️ 22°C 💧30%");
});

test("forecastUrl", () => {
  expect(forecastUrl({ lat: 31.38, lon: 121.25 })).toBe(
    "https://api.open-meteo.com/v1/forecast?latitude=31.38&longitude=121.25&hourly=temperature_2m,precipitation_probability,weather_code&timezone=UTC&forecast_days=16",
  );
});

test("coordsByEvent matches F1 events to sportstimes races by race day", async () => {
  const sessions = applyRules(parseTunous("f1", 2026, await fixture("tunous-formula1")));
  const coords = coordsByEvent(sessions, await fixture("st-f1"));
  expect(coords.get("2026-chinese-grand-prix")).toEqual({ lat: 31.3807, lon: 121.2498 });
  expect(coords.size).toBeGreaterThan(15);
});
