import { Database } from "bun:sqlite";
import type { ChatInputCommandInteraction } from "discord.js";
import { runMigrations } from "../../../../src/core/db.ts";
import { coreMigrations } from "../../../../src/core/settings.ts";
import type { MangaDexGet } from "../../../../src/modules/manga/api/types.ts";
import type { CommandCtx } from "../../../../src/modules/manga/commands/types.ts";
import { MangaRepo } from "../../../../src/modules/manga/store/repo.ts";
import { mangaMigrations } from "../../../../src/modules/manga/store/migrations.ts";

export interface FakeOptions {
  strings?: Record<string, string>;
  channelId?: string;
  manageServer?: boolean;
  get?: MangaDexGet;
}

/** A /manga command context over in-memory tables; `replies` collects what the member saw. */
export function fakeCommand(o: FakeOptions = {}) {
  const db = new Database(":memory:", { strict: true });
  runMigrations(db, [...coreMigrations, ...mangaMigrations]);
  const replies: string[] = [];
  const i = {
    deferred: false,
    user: { id: "u1" },
    memberPermissions: { has: () => o.manageServer ?? false },
    options: {
      getString: (name: string) => o.strings?.[name] ?? null,
      getChannel: () => (o.channelId ? { id: o.channelId } : null),
    },
    deferReply: async () => {
      i.deferred = true;
    },
    reply: async (body: { content: string }) => void replies.push(body.content),
    editReply: async (body: { content: string }) => void replies.push(body.content),
  };
  const ctx: CommandCtx = {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- a stand-in for the calls the handlers make
    i: i as unknown as ChatInputCommandInteraction,
    db,
    repo: new MangaRepo(db),
    get: o.get ?? (async () => ({ data: [], total: 0 })),
  };

  return { ctx, replies };
}
