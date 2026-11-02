import type { Snapshot } from "../../src/core/countries/types.ts";

/** One line per country: code, name, flag colours and features. */
export function flagTable(snapshot: Snapshot): string[] {
  return snapshot.countries.map(({ iso2, name, facts }) => {
    const features = facts.flagFeatures.join(",") || "-";

    return `${iso2} ${name.padEnd(28)} ${facts.flagColours.join(",").padEnd(36)} ${features}`;
  });
}

function count(
  snapshot: Snapshot,
  label: string,
  test: (c: Snapshot["countries"][number]) => boolean,
) {
  const matching = snapshot.countries.filter(test);

  return `${label.padEnd(22)} ${String(matching.length).padStart(3)}`;
}

/** Per-fact counts: how many countries carry each value, and how many are unknown (null). */
export function factCounts(snapshot: Snapshot): string[] {
  const lines: string[] = [];
  const yes = (key: "landlocked" | "island" | "monarchy" | "drivesLeft") =>
    count(snapshot, key, (c) => c.facts[key] === true);

  for (const key of ["landlocked", "island", "monarchy", "drivesLeft"] as const) {
    lines.push(
      yes(key),
      count(snapshot, `${key} unknown`, (c) => c.facts[key] === null),
    );
  }

  const lists = snapshot.countries.flatMap((c) => [
    ...c.facts.continents.map((v) => `continent ${v}`),
    ...c.facts.memberships.map((v) => `member ${v}`),
    ...c.facts.languages.map((v) => `language ${v}`),
    ...c.facts.flagColours.map((v) => `colour ${v}`),
    ...c.facts.flagFeatures.map((v) => `feature ${v}`),
  ]);

  for (const label of [...new Set(lists)].toSorted()) {
    lines.push(
      `${label.padEnd(22)} ${String(lists.filter((l) => l === label).length).padStart(3)}`,
    );
  }

  lines.push(
    count(snapshot, "no continent", (c) => c.facts.continents.length === 0),
    count(snapshot, "no borders", (c) => c.facts.borders.length === 0),
    count(snapshot, "no aliases", (c) => c.facts.aliases.length === 0),
    count(snapshot, "no flag colours", (c) => c.facts.flagColours.length === 0),
  );

  return lines;
}
