import { type APIEmbed, ApplicationCommandOptionType, MessageFlags } from "discord.js";
import type { BotModule } from "../../core/types.ts";

const EMBED_COLOR = 0xe10600;
/** Discord caps an embed description at 4096 characters and a whole message's embeds at 6000. */
const PAGE_LIMIT = 4000;

/** A clickable command mention when the ID is known, plain code otherwise. */
function mention(path: string, id: string | undefined): string {
  return id ? `</${path}:${id}>` : `\`/${path}\``;
}

function moduleLines(module: BotModule, commandIds: ReadonlyMap<string, string>): string[] {
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

  return lines;
}

/** Whole sections packed into pages of at most `limit` characters. */
export function pack(sections: string[], limit = PAGE_LIMIT): string[] {
  const pages: string[] = [];

  for (const section of sections) {
    const last = pages.at(-1);

    if (last !== undefined && last.length + 2 + section.length <= limit) {
      pages[pages.length - 1] = `${last}\n\n${section}`;
    } else pages.push(section);
  }

  return pages;
}

/** One embed per page, each sent as its own message so neither Discord limit is hit. */
export function helpPages(
  modules: BotModule[],
  commandIds: ReadonlyMap<string, string>,
): APIEmbed[] {
  const sections = modules.flatMap((module) => {
    const lines = moduleLines(module, commandIds);

    return lines.length > 0 ? [`### ${module.title ?? module.name}\n${lines.join("\n")}`] : [];
  });
  const pages = pack(sections);

  return pages.map((description, n) => ({
    title: pages.length > 1 ? `Gork commands (${n + 1}/${pages.length})` : "Gork commands",
    color: EMBED_COLOR,
    description,
  }));
}

export function helpModule(modules: BotModule[]): BotModule {
  const self: BotModule = {
    name: "help",
    title: "❓ Help",
    commands: [
      {
        data: { name: "help", description: "List every command" },
        async execute(i, ctx) {
          const [first, ...rest] = helpPages([...modules, self], ctx.commandIds);
          await i.reply({ embeds: first ? [first] : [], flags: MessageFlags.Ephemeral });

          for (const page of rest)
            await i.followUp({ embeds: [page], flags: MessageFlags.Ephemeral });
        },
      },
    ],
  };

  return self;
}
