import { type APIMessageTopLevelComponent, ComponentType, MessageFlags } from "discord.js";
import { boardText } from "./board.ts";
import { controlRow, wordRows } from "./buttons.ts";
import type { BoardView } from "./types.ts";

/** The game message, Components V2: the text, then the word buttons and the controls. */
export function groupsView(v: BoardView) {
  const components: APIMessageTopLevelComponent[] = [
    { type: ComponentType.TextDisplay, content: boardText(v) },
    ...wordRows(v),
    ...controlRow(v),
  ];

  return {
    flags: MessageFlags.IsComponentsV2 as const,
    components,
    allowedMentions: { parse: [] as [] },
  };
}
