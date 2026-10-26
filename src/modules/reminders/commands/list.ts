import type { CommandCtx } from "./types.ts";
import { listMessage } from "../render.ts";
import { reply } from "./kit.ts";

export async function list({ i, guildId, store }: CommandCtx): Promise<void> {
  await reply(i, listMessage(store.pendingByAuthor(guildId, i.user.id)));
}
