/** Replies to anyone who posts in a read-only series channel. `{user}` = their mention. */
export const ROASTS: readonly string[] = [
  "stfu bitch",
  "{user} stfu bitch",
  "nobody asked {user} 💀",
  "read-only channel, {user}. reading was the one job",
  "{user} typed all that for nothing lmao",
  "deleted. just like your podium chances {user}",
  "BOX BOX BOX {user}, get out of my channel",
  "track limits exceeded, {user}. message deleted",
  "{user} has been black-flagged 🏴",
  "drive-through penalty for {user}",
  "the stewards reviewed your message {user}. it was ass",
  "{user} talking during the formation lap smh",
  "{user} is this your first race weekend",
  "message retired from the race. DNF {user}",
  "{user} you're not even on the grid",
  "copy {user}, we are checking... no",
  "{user} radio check: nobody's listening",
  "pit lane is closed {user} 🚧",
];

/** Picks a roast; `random` returns a value in [0, 1). */
export function pickRoast(userMention: string, random: () => number = Math.random): string {
  const index = Math.min(Math.floor(random() * ROASTS.length), ROASTS.length - 1);
  return (ROASTS[index] ?? "stfu bitch").replaceAll("{user}", userMention);
}
