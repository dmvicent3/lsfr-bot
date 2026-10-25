import { describe, expect, test } from "bun:test";
import { isRuling, parisTime, parseFiaDocuments } from "./fia.ts";
import { parseRuling } from "./ruling.ts";
import { textFixture } from "../testing/fixtures.ts";

describe("parseFiaDocuments", () => {
  test("the active event and every document with title, url and publish time", async () => {
    const page = parseFiaDocuments(await textFixture("fia-documents.html"));
    expect(page.event).toBe("Singapore Grand Prix");
    expect(page.documents).toHaveLength(89);
    expect(page.documents).toContainEqual({
      url: "https://www.fia.com/system/files/decision-document/2026_singapore_grand_prix_-_infringement_-_car_23_-_causing_a_collision_with_car_5.pdf",
      title: "Infringement - Car 23 - Causing a Collision with Car 5",
      publishedAt: new Date("2026-10-10T14:20:00Z"),
    });
  });

  test("a page without documents", () => {
    expect(parseFiaDocuments("<html></html>")).toEqual({ event: null, documents: [] });
  });
});

test("rulings are car decisions and infringements", () => {
  expect(isRuling("Decision - Car 44 - Alleged leaving the track")).toBe(true);
  expect(isRuling("Infringement - Car 14 - PU element")).toBe(true);
  expect(isRuling("Infringement - Qualifying deleted lap times")).toBe(false);
  expect(isRuling("Summons - Car 11 - Alleged causing a collision")).toBe(false);
  expect(isRuling("Final Race Classification")).toBe(false);
});

test("FIA times are Paris time, summer and winter", () => {
  expect(parisTime("10.10.26 16:20")).toEqual(new Date("2026-10-10T14:20:00Z"));
  expect(parisTime("07.12.26 18:05")).toEqual(new Date("2026-12-07T17:05:00Z"));
  expect(parisTime("nonsense")).toBeNull();
});

describe("parseRuling", () => {
  test("fields of a ruling, multi-line ones joined, the appeal boilerplate cut", async () => {
    const r = parseRuling(await textFixture("fia-ruling-no-penalty.txt"));
    expect(r).toMatchObject({
      car: "23",
      driver: "Alexander Albon",
      competitor: "Atlassian Williams F1 Team",
      session: "Sprint",
      fact: "Car 23 collided with Car 5 in Turn 16",
      decision: "No Penalty is applied",
    });
    expect(r?.reason).toStartWith(
      "The Stewards heard from the driver of Car 5 (Gabriel Bortoleto)",
    );
    expect(r?.reason).toEndWith("determined not to apply a penalty in this case.");
  });

  test("a multi-line fact and an accented word survive", async () => {
    const r = parseRuling(await textFixture("fia-ruling-pit-lane.txt"));
    expect(r?.session).toBe("Qualifying");
    expect(r?.fact).toBe(
      "The following Power Unit elements have been used: 6th Turbocharger (TC) In addition, the setup of the suspension has been changed while under parc fermé. The team also continued to work on the car beyond the covers-on time.",
    );
    expect(r?.decision).toBe("Required to start the Race from the pit lane.");
  });

  test("no further action", async () => {
    const r = parseRuling(await textFixture("fia-ruling-nfa.txt"));
    expect(r).toMatchObject({ car: "44", driver: "Lewis Hamilton", session: "Race" });
    expect(r?.decision).toBe("No further action.");
  });

  test("not a ruling", () => {
    expect(parseRuling("Final Race Classification\n1 Verstappen")).toBeNull();
  });
});

test("poppler's layout (the one in production) parses the same", async () => {
  const xpdf = parseRuling(await textFixture("fia-ruling-no-penalty.txt"));
  const poppler = parseRuling(await textFixture("fia-ruling-no-penalty-poppler.txt"));
  expect(poppler).toEqual(xpdf);
});
