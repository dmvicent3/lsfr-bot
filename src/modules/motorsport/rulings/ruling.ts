import type { Ruling } from "./types.ts";
import { squash } from "./fia.ts";

const LABELS = [
  "No / Driver",
  "Competitor",
  "Time",
  "Session",
  "Fact",
  "Infringement",
  "Decision",
  "Reason",
] as const;
type Label = (typeof LABELS)[number];
type Fields = Map<Label, string[]>;

const LABEL_LINE = new RegExp(`^(${LABELS.map((l) => l.replace("/", "\\/")).join("|")})\\b(.*)$`);

/** The appeal and independence notices every ruling ends with. */
const BOILERPLATE = /^(Competitors are reminded|Decisions of the Stewards are taken)/;

/** Files one line: a label starts a field; indented or blank lines continue it; anything else ends it. */
function fileLine(fields: Fields, current: Label | null, line: string): Label | null {
  const label = LABEL_LINE.exec(line);
  if (label) {
    const found = LABELS.find((l) => l === label[1]) ?? null;
    if (found) fields.set(found, [label[2] ?? ""]);
    return found;
  }
  const continues = line.trim() === "" || /^\s/.test(line);
  if (!current || !continues || BOILERPLATE.test(line.trim())) return null;
  fields.get(current)?.push(line);
  return current;
}

function readFields(text: string): (l: Label) => string {
  const fields: Fields = new Map();
  let current: Label | null = null;
  for (const line of text.split(/\r?\n/)) current = fileLine(fields, current, line);
  return (l) => squash((fields.get(l) ?? []).join(" "));
}

/**
 * pdftotext -layout output of a ruling → its fields. A field runs from its label to the next
 * label or unindented line; continuation lines are indented.
 */
export function parseRuling(text: string): Ruling | null {
  const field = readFields(text);
  const driver = /^(\d+) - (.+)$/.exec(field("No / Driver"));
  const decision = field("Decision");
  if (!driver?.[1] || !driver[2] || !decision) return null;
  return {
    car: driver[1],
    driver: driver[2],
    competitor: field("Competitor"),
    session: field("Session"),
    fact: field("Fact"),
    infringement: field("Infringement"),
    decision,
    reason: field("Reason"),
  };
}
