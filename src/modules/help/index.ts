import { type APIEmbed, ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { BotModule } from "../../core/module.ts";

const EMBED_COLOR = 0xe10600;

/** A clickable command mention when the ID is known, plain code otherwise. */
function mention(path: string, id: string | undefined): string {
  return id ? `</${path}:${id}>` : `\`/${path}\``;
}

export function helpEmbed(modules: BotModule[], commandIds: ReadonlyMap<string, string>): APIEmbed {
  const sections: string[] = [];
  for (const module of modules) {
    const lines: string[] = [];
    for (const { data } of module.commands ?? []) {
      const id = commandIds.get(data.name);
      const subcommands = (data.options ?? []).filter(
        (o) => o.type === ApplicationCommandOptionType.Subcommand,
      );
      if (subcommands.length === 0) lines.push(`${mention(data.name, id)} · ${data.description}`);
      for (const sub of subcommands) {
        lines.push(`${mention(`${data.name} ${sub.name}`, id)} · ${sub.description}`);
      }
    }
    if (module.helpNote) lines.push(module.helpNote);
    if (lines.length > 0) sections.push(`### ${module.title ?? module.name}\n${lines.join("\n")}`);
  }
  return { title: "Gork commands", color: EMBED_COLOR, description: sections.join("\n\n") };
}

export function helpModule(modules: BotModule[]): BotModule {
  const self: BotModule = {
    name: "help",
    title: "❓ Help",
    commands: [
      {
        data: { name: "help", description: "List every command" },
        async execute(i, ctx) {
          await i.reply({
            embeds: [helpEmbed([...modules, self], ctx.commandIds)],
            flags: MessageFlags.Ephemeral,
          });
        },
      },
    ],
  };
  return self;
}
