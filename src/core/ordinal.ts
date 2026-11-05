const SUFFIX: Record<string, string> = { one: "st", two: "nd", few: "rd", other: "th" };
const rules = new Intl.PluralRules("en-US", { type: "ordinal" });

/** 1 → "1st", 22 → "22nd". */
export const ordinal = (n: number): string => `${n}${SUFFIX[rules.select(n)] ?? "th"}`;
