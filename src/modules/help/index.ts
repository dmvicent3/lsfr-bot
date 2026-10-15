import { ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { BotModule } from "../../core/module.ts";

export function helpText(modules: BotModule[]): string {
  const lines: string[] = [];
  for (const command of modules.flatMap((m) => m.commands ?? [])) {
    const { name, description, options = [] } = command.data;
    const subcommands = options.filter((o) => o.type === ApplicationCommandOptionType.Subcommand);
    if (subcommands.length === 0) lines.push(`/${name} — ${description}`);
    for (const sub of subcommands) lines.push(`/${name} ${sub.name} — ${sub.description}`);
  }
  return lines.join("\n");
}

export function helpModule(modules: BotModule[]): BotModule {
  const self: BotModule = {
    name: "help",
    commands: [
      {
        data: { name: "help", description: "List every command" },
        async execute(i) {
          await i.reply({ content: helpText([...modules, self]), flags: MessageFlags.Ephemeral });
        },
      },
    ],
  };
  return self;
}
