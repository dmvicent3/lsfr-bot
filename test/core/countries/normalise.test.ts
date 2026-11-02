import { describe, expect, test } from "bun:test";
import { normaliseName } from "../../../src/core/countries/normalise.ts";

describe("normaliseName", () => {
  test.each([
    ["Côte d'Ivoire", "cote d ivoire"],
    ["Åland", "aland"],
    ["The Bahamas", "bahamas"],
    ["St. Lucia", "st lucia"],
    ["Bosnia & Herzegovina", "bosnia and herzegovina"],
    ["  Timor-Leste  ", "timor leste"],
    ["Theodora", "theodora"],
    ["", ""],
  ])("%s", (input, out) => expect(normaliseName(input)).toBe(out));
});
