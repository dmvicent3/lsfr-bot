import type { Database } from "bun:sqlite";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { registerCommands } from "./commands.ts";
import type { Config } from "./config.ts";
import { routeInteraction } from "./interactions.ts";
import { log } from "./log.ts";
import type { BotModule, Ctx } from "./module.ts";
import { rejectRenameRateLimit } from "./rate-limit.ts";
import { buildRouter, type Router } from "./router.ts";
import { safely, startJobs } from "./scheduler.ts";

function createClient(): Client {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    rest: { rejectOnRateLimit: rejectRenameRateLimit },
  });
}

/** Once logged in: start every module's jobs and register the commands. */
function onReady(client: Client, modules: BotModule[], router: Router, ctx: Ctx): void {
  client.once(Events.ClientReady, (ready) => {
    log.info("core", `logged in as ${ready.user.tag}`);
    const jobs = modules.flatMap((m) => (m.jobs ?? []).map((job) => ({ module: m.name, job })));
    startJobs(jobs, ctx);
    void registerCommands(ready.application.id, router.commands, ctx);
  });
}

function onClientEvents(client: Client): void {
  // Without a listener, an emitted "error" event would crash the process.
  client.on(Events.Error, (err) => log.error("core:client", "client error", err));
  client.on(Events.ShardDisconnect, (event, shardId) =>
    log.info("core:client", `shard ${shardId} disconnected (${event.code}), reconnecting`),
  );
}

function onModuleEvents(client: Client, modules: BotModule[], ctx: Ctx): void {
  for (const module of modules) {
    for (const handler of module.events ?? []) {
      client.on(handler.event, (...args: unknown[]) => {
        void safely(`${module.name}:${handler.event}`, () => handler.handle(ctx, ...args));
      });
    }
  }
}

export async function startBot(
  modules: BotModule[],
  config: Config,
  db: Database,
): Promise<Client> {
  const router = buildRouter(modules);
  const client = createClient();
  const ctx: Ctx = { client, db, config, commandIds: new Map() };
  onReady(client, modules, router, ctx);
  onClientEvents(client);
  client.on(Events.InteractionCreate, (interaction) => {
    void safely("core:interaction", () => routeInteraction(interaction, router, ctx));
  });
  onModuleEvents(client, modules, ctx);
  await client.login(config.discordToken);
  return client;
}
