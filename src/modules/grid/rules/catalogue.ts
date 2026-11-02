import { RULE_ID_LIST, type RuleDef, type RuleId } from "../types.ts";
import { FLAG } from "./flag.ts";
import { GEO } from "./geo.ts";
import { POLITICS } from "./politics.ts";
import { STAT } from "./stat.ts";

const ALL: RuleDef[] = [...GEO, ...FLAG, ...STAT, ...POLITICS];

function complete(map: Partial<Record<RuleId, RuleDef>>): map is Record<RuleId, RuleDef> {
  return RULE_ID_LIST.every((id) => map[id] !== undefined);
}

function byId(defs: RuleDef[]): Record<RuleId, RuleDef> {
  const map: Partial<Record<RuleId, RuleDef>> = {};

  for (const d of defs) map[d.id] = d;

  if (!complete(map)) {
    throw new Error(
      `rule catalogue is missing: ${RULE_ID_LIST.filter((id) => !map[id]).join(", ")}`,
    );
  }

  return map;
}

export const RULES = byId(ALL);

export const RULE_IDS: RuleId[] = ALL.map((r) => r.id);
