import type { BotModule } from "../../core/types.ts";
import { dailiesCommand } from "./command.ts";

export const dailiesModule: BotModule = {
  name: "dailies",
  title: "📅 Dailies",
  helpNote: "Read-only: it never opens a puzzle for you.",
  commands: [dailiesCommand],
};
