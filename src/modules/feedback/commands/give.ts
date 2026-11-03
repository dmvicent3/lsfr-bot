import { feedbackModal } from "../modal.ts";
import type { CommandCtx } from "./types.ts";

/** Opens the feedback form for the chosen topic. */
export async function give({ i }: CommandCtx): Promise<void> {
  const topic = i.options.getString("topic", true);

  await i.showModal(feedbackModal(`feedback:give:${topic}`, `Feedback · ${topic}`));
}
