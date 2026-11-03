import type { BotModule } from "../../core/types.ts";
import { feedbackCommand } from "./commands/commands.ts";
import { feedbackComponents } from "./components/components.ts";
import { feedbackModals } from "./modals/modals.ts";
import { feedbackMigrations } from "./store/migrations.ts";

/** `topics`: the /feedback give choices, from `feedbackTopics`. */
export function feedbackModule(topics: string[]): BotModule {
  return {
    name: "feedback",
    title: "💬 Feedback",
    helpNote:
      "Tell us what to fix or add. Your feedback is posted in the channel; edit or remove it with its buttons. Gork's developer may also ask questions with polls.",
    commands: [feedbackCommand(topics)],
    components: feedbackComponents(),
    modals: feedbackModals(),
    migrations: feedbackMigrations,
  };
}
