import type { Database } from "bun:sqlite";
import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  REST,
  Routes,
  type Interaction,
} from "discord.js";
import type { Config } from "./config.ts";
import { log } from "./log.ts";
import type { BotModule, Ctx } from "./module.ts";
import { rejectRenameRateLimit } from "./rate-limit.ts";
import { retry } from "./retry.ts";
import { buildRouter, type Router } from "./router.ts";
import { safely, startJobs } from "./scheduler.ts";

export async function startBot(
  modules: BotModule[],
  config: Config,
  db: Database,
): Promise<Client> {
  const router = buildRouter(modules);
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
    rest: { rejectOnRateLimit: rejectRenameRateLimit },
  });
  const ctx: Ctx = { client, db, config };

  client.once(Events.ClientReady, (ready) => {
    log.info("core", `logged in as ${ready.user.tag}`);
    startJobs(
      modules.flatMap((module) => (module.jobs ?? []).map((job) => ({ module: module.name, job }))),
      ctx,
    );
    // Jobs run regardless; without commands the bot is unusable, so exit and let Docker restart.
    const rest = new REST().setToken(config.discordToken);
    retry(
      () =>
        rest.put(Routes.applicationGuildCommands(ready.application.id, config.guildId), {
          body: router.commands.map((command) => command.data),
        }),
      { attempts: 5, delayMs: 5_000 },
    ).then(
      () => log.info("core", `registered ${router.commands.length} commands`),
      (err: unknown) => {
        log.error("core", "command registration failed, exiting", err);
        process.exit(1);
      },
    );
  });

  client.on(Events.InteractionCreate, (interaction) => {
    void safely("core:interaction", () => routeInteraction(interaction, router, ctx));
  });

  for (const module of modules) {
    for (const handler of module.events ?? []) {
      client.on(handler.event, (...args: unknown[]) => {
        void safely(`${module.name}:${handler.event}`, () => handler.handle(ctx, ...args));
      });
    }
  }

  await client.login(config.discordToken);
  return client;
}

async function routeInteraction(interaction: Interaction, router: Router, ctx: Ctx): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      await router.command(interaction.commandName)?.execute(interaction, ctx);
    } else if (interaction.isAutocomplete()) {
      await router.command(interaction.commandName)?.autocomplete?.(interaction, ctx);
    } else if (interaction.isMessageComponent()) {
      const route = router.component(interaction.customId);
      await route?.handler.handle(interaction, route.args, ctx);
    }
  } catch (err) {
    log.error("core:interaction", "handler failed", err);
    if (!interaction.isRepliable()) return;
    const message = err instanceof Error ? err.message : String(err);
    const reply = {
      content: `Something went wrong: ${message}`,
      flags: MessageFlags.Ephemeral,
    } as const;
    await (interaction.replied || interaction.deferred
      ? interaction.followUp(reply)
      : interaction.reply(reply));
  }
}
