import type { RuleDef, RuleId } from "../types.ts";
import { FLAG } from "./flag.ts";
import { GEO } from "./geo.ts";
import { POLITICS } from "./politics.ts";
import { STAT } from "./stat.ts";

const ALL: RuleDef[] = [...GEO, ...FLAG, ...STAT, ...POLITICS];

// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- every RuleId is defined above, the catalogue test checks ids against keys
export const RULES = Object.fromEntries(ALL.map((r) => [r.id, r])) as Record<RuleId, RuleDef>;

export const RULE_IDS: RuleId[] = ALL.map((r) => r.id);
