/** Discord allows 100 user ids in `allowedMentions.users`. */
const MAX_USERS = 100;

export const mentionText = (userIds: string[]): string => userIds.map((id) => `<@${id}>`).join(" ");

/** Followers split into groups whose mentions fit one message (`limit` chars, 100 users). */
export function chunkMentions(userIds: string[], limit = 2000): string[][] {
  const chunks: string[][] = [];
  let current: string[] = [];
  let length = 0;

  for (const id of userIds) {
    const size = `<@${id}>`.length;
    const full = length + 1 + size > limit || current.length === MAX_USERS;

    if (current.length > 0 && full) {
      chunks.push(current);
      current = [];
    }

    length = current.length > 0 ? length + 1 + size : size;
    current.push(id);
  }

  if (current.length > 0) chunks.push(current);

  return chunks;
}
