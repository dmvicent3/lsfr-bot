/** Guilds where jevos is mid-move or a game is starting; per process, a restart drops it. */
const thinking = new Set<string>();

/** Claims the guild's turn; false when jevos is already busy there. */
export function startThinking(guildId: string): boolean {
  if (thinking.has(guildId)) return false;

  thinking.add(guildId);

  return true;
}

export function stopThinking(guildId: string): void {
  thinking.delete(guildId);
}
