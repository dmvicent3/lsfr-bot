import { log } from "../../../core/log.ts";
import type { Snapshot } from "../../../core/countries/types.ts";
import type { CommandCtx } from "./types.ts";

export const UNAVAILABLE = "Country grid is unavailable — country data is missing.";

/** The country data, or null after logging and telling the player it is unavailable. */
export async function snapshotOrReply(c: CommandCtx): Promise<Snapshot | null> {
  const snapshot = c.snapshotSource();

  if (!snapshot) {
    log.error("grid", "country data missing, country grid unavailable");
    await c.i.editReply(UNAVAILABLE);
  }

  return snapshot;
}
