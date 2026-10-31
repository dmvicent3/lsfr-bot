import { expect, test } from "bun:test";
import { withoutEcho } from "../../../src/modules/chat/echo.ts";

const TURNS = [
  { role: "user" as const, text: "12x: who is the uk pm?" },
  { role: "model" as const, text: "Andy Burnham." },
  { role: "user" as const, text: "tyh: since when?\nThe Pope: and why" },
];

test("a reply that starts with someone's name prefix from the chain loses it", () => {
  expect(withoutEcho("12x: Hey! It's Andy Burnham.", TURNS)).toBe("Hey! It's Andy Burnham.");
  expect(withoutEcho("The Pope: Since July.", TURNS)).toBe("Since July.");
});

test("other text with a colon stays as it is", () => {
  expect(withoutEcho("Note: it changed in July.", TURNS)).toBe("Note: it changed in July.");
  expect(withoutEcho("Since July 2026. 12x: thanks", TURNS)).toBe("Since July 2026. 12x: thanks");
});
