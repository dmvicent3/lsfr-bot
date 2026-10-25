import { expect, test } from "bun:test";
import { pickRoast, ROASTS } from "../../../src/modules/motorsport/roasts.ts";

test("includes the classic", () => {
  expect(ROASTS).toContain("stfu bitch");
});

test("picks by the random value and fills in the mention", () => {
  const last = ROASTS.length - 1;
  const lastRoast = ROASTS[last] ?? "";
  const picked = pickRoast("<@42>", () => 0.9999);
  expect(picked).toBe(lastRoast.replaceAll("{user}", "<@42>"));
  expect(pickRoast("<@42>", () => 0)).toBe((ROASTS[0] ?? "").replaceAll("{user}", "<@42>"));
});

test("every roast mentions the user or stands on its own", () => {
  for (const roast of ROASTS) expect(roast.length).toBeGreaterThan(0);
  expect(ROASTS.filter((r) => r.includes("{user}")).length).toBeGreaterThan(ROASTS.length / 2);
});
