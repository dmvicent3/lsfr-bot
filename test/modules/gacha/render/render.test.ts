import { describe, expect, test } from "bun:test";
import { bannerSvg } from "../../../../src/modules/gacha/render/banner.ts";
import { cardPng, cardSvg } from "../../../../src/modules/gacha/render/images.ts";
import { showOrder } from "../../../../src/modules/gacha/render/order.ts";
import {
  familyLines,
  fitSize,
  givenName,
  initials,
} from "../../../../src/modules/gacha/render/svg.ts";
import { tenSvg } from "../../../../src/modules/gacha/render/ten.ts";
import { driver } from "../testing/drivers.ts";

const PNG = [0x89, 0x50, 0x4e, 0x47];

describe("helpers", () => {
  test("initials and given names from the full and family name", () => {
    expect(initials("Ayrton Senna", "Senna")).toBe("AS");
    expect(givenName("Pedro de la Rosa", "de la Rosa")).toBe("Pedro");
  });

  test("fitSize shrinks long text and never passes the max", () => {
    expect(fitSize("Moss", 300, 42, true)).toBe(42);
    expect(fitSize("Montgomerie-Charrington", 180, 30, true)).toBeLessThan(15);
  });

  test("a long family name breaks after its hyphen", () => {
    expect(familyLines("Montgomerie-Charrington", 180, 30).lines).toEqual([
      "Montgomerie-",
      "Charrington",
    ]);
    expect(familyLines("Senna", 180, 30).lines).toEqual(["Senna"]);
  });
});

describe("cards", () => {
  test("a card escapes the name and renders to a PNG twice its size", () => {
    const d = driver({ id: "x", name: "Pat O'Ward", family: "O'Ward", tier: 5 });

    expect(cardSvg(d, { level: 3, isNew: true })).toContain("O&apos;Ward");

    const png = cardPng(d, { level: 3, isNew: true });

    expect([...png.subarray(0, 4)]).toEqual(PNG);
    expect(png.readUInt32BE(16)).toBe(720);
  });

  test("the 10-pull grid is two rows of five, the first card marked best", () => {
    const cards = Array.from({ length: 10 }, (_, i) => ({
      driver: driver({ id: `d${i}`, tier: i === 0 ? 5 : 3 }),
      level: 0,
      isNew: false,
      best: i === 0,
    }));
    const svg = tenSvg(cards);

    expect(svg).toContain('width="1112"');
    expect(svg.match(/>BEST</g)).toHaveLength(1);
    expect(svg).toContain("1 × ★★★★★");
  });

  test("the banner shows the ★5 and its three ★4s", () => {
    const svg = bannerSvg({
      five: driver({ id: "a", name: "Ann Five", family: "Five", tier: 5 }),
      fours: ["B", "C", "D"].map((n) =>
        driver({ id: n, name: `X ${n}four`, family: `${n}four`, tier: 4 }),
      ),
      title: "Limited banner",
      subtitle: "Week of 9 Nov",
      footer: "Ends soon",
    });

    for (const word of ["Five", "Bfour", "Cfour", "Dfour", "Limited banner"]) {
      expect(svg).toContain(word);
    }
  });
});

const l = (id: string, tier: 3 | 4 | 5, featured = false, isNew = false) => ({
  id,
  tier,
  featured,
  isNew,
});

describe("showOrder", () => {
  test("rarest first, then featured, then new, else pull order", () => {
    const order = showOrder([
      l("a", 3),
      l("b", 4),
      l("c", 5),
      l("d", 4, false, true),
      l("e", 4, true),
    ]);

    expect(order.map((x) => x.id)).toEqual(["c", "e", "d", "b", "a"]);
  });
});
