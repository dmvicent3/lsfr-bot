import type { Landed } from "../engine/types.ts";

/** Rarest first; within a tier featured, then new, then pull order. The first is the best pull. */
export const showOrder = <L extends Pick<Landed, "tier" | "featured" | "isNew">>(
  landed: readonly L[],
): L[] =>
  landed.toSorted((a, b) => b.tier - a.tier || +b.featured - +a.featured || +b.isNew - +a.isNew);
