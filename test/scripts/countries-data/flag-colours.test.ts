import { describe, expect, test } from "bun:test";
import { coloursFromSvg, familyOf } from "../../../scripts/countries-data/flag-colours.ts";
import { FLAG_OVERRIDES, applyOverrides } from "../../../scripts/countries-data/flag-overrides.ts";
import countries from "../../../src/core/countries/countries.json";

describe("familyOf", () => {
  test("maps the flag staples to their family", () => {
    expect(familyOf("#FFFFFF")).toBe("white");
    expect(familyOf("#000000")).toBe("black");
    expect(familyOf("#CE1126")).toBe("red");
    expect(familyOf("#002868")).toBe("blue");
    expect(familyOf("#009739")).toBe("green");
    expect(familyOf("#FCD116")).toBe("yellow");
    expect(familyOf("#FF8200")).toBe("orange");
  });

  test("greys, browns and malformed input have no family", () => {
    expect(familyOf("#808080")).toBeNull();
    expect(familyOf("#8B4513")).toBeNull();
    expect(familyOf("nope")).toBeNull();
  });

  test("accepts short hex", () => {
    expect(familyOf("#f00")).toBe("red");
  });
});

const SVG = `<svg xmlns="http://www.w3.org/2000/svg">
  <style>.a{fill:#009739;stroke:none}</style>
  <rect fill="#FFFFFF" width="9" height="6"/>
  <rect style="fill:#CE1126;stroke:#000" width="3" height="6"/>
  <circle fill="blue" stroke="rgb(252,209,22)" fill-opacity="1"/>
  <path fill="url(#g)" stroke="#808080"/>
  <path fill="#ffffff"/>
</svg>`;

describe("coloursFromSvg", () => {
  test("collects distinct families from fill and stroke, hex and named", () => {
    expect(coloursFromSvg(SVG)).toEqual(["red", "blue", "green", "yellow", "white", "black"]);
  });

  test("returns nothing for a document without colours", () => {
    expect(coloursFromSvg("<svg/>")).toEqual([]);
  });
});

describe("overrides", () => {
  test("replace colours when given and always set features", () => {
    expect(applyOverrides("ES", ["red", "yellow", "white", "blue"])).toEqual({
      colours: ["red", "yellow"],
      features: ["emblem"],
    });
  });

  test("keep detected colours when the override has none", () => {
    expect(applyOverrides("US", ["red", "white", "blue"])).toEqual({
      colours: ["red", "white", "blue"],
      features: ["star"],
    });
  });

  test("an unlisted code gets no features", () => {
    expect(applyOverrides("ZZ", ["red"])).toEqual({ colours: ["red"], features: [] });
  });

  test("every snapshot country is listed", () => {
    const missing = countries.countries.filter((c) => !(c.iso2 in FLAG_OVERRIDES));

    expect(missing.map((c) => c.iso2)).toEqual([]);
  });
});
