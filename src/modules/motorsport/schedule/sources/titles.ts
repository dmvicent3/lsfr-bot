const TITLES: Record<string, string> = {
  fp1: "Practice 1",
  fp2: "Practice 2",
  practice: "Practice",
  FinalPractice: "Final Practice",
  qualifying: "Qualifying",
  qualifying1: "Qualifying",
  qualifying2: "Qualifying 2",
  sprint: "Sprint",
  feature: "Feature Race",
  race: "Race",
  gp: "Race",
  warmup: "Warm Up",
};

export function sessionTitle(key: string): string {
  const known = TITLES[key];

  if (known) return known;

  const practice = /^practice(\d+)$/.exec(key);

  if (practice) return `Practice ${practice[1]}`;

  return key
    .replaceAll(/([a-z])([A-Z0-9])/g, "$1 $2")
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const HOUR = 3_600_000;

export function defaultDurationMs(key: string): number {
  return key === "race" || key === "feature" || key === "gp" ? 2 * HOUR : HOUR;
}
