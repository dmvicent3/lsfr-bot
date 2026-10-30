/** The ephemeral answer to a button click. */
export function pickReply(result: "locked" | "already" | "closed", letter: string | null): string {
  if (result === "locked") return `Locked in: ${letter ?? "?"}.`;

  if (result === "already") return `You already picked ${letter ?? "?"}.`;

  return "This question is over.";
}

const TOPIC_REPLIES = { "not-yours": "Not your pick.", over: "This choice is over." };

export const topicReply = (result: "not-yours" | "over"): string => TOPIC_REPLIES[result];
