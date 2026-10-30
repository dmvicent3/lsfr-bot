/** Players whose jevos is mid-move or whose game is starting; per process, a restart drops it. */
const thinking = new Set<string>();

export const thinkKey = (guildId: string, playerId: string): string => `${guildId}:${playerId}`;

/** Claims the player's turn; false when jevos is already busy on their game. */
export function startThinking(key: string): boolean {
  if (thinking.has(key)) return false;

  thinking.add(key);

  return true;
}

export function stopThinking(key: string): void {
  thinking.delete(key);
}

export const isThinking = (key: string): boolean => thinking.has(key);
