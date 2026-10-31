import { drawOne, passDrawn } from "./draw.ts";
import { pickColour } from "./paint.ts";
import { dropSeat, mostHeld } from "./quit.ts";
import { type Act, type Game, MAX_IDLE, type Seat } from "./types.ts";

/** What the clock did; null when nothing. */
export type Change = "lobby-closed" | "timed-out" | "dropped";

/** Plays the idle player's turn for them: picks a colour, takes a waiting draw, or draws and passes. */
function autoMove(g: Game, s: Seat, a: Act): void {
  if (g.step === "paint") {
    pickColour(g, { ...a, colour: mostHeld(s.hand) });

    return;
  }

  if (g.step === "drawn" || drawOne(g, a) === "can-play") passDrawn(g, a);
}

/** Closes a lobby past its time, or acts for a player past theirs; 3 in a row drops them. */
export function advance(g: Game, now: number, random: () => number): Change | null {
  if (g.phase === "lobby" && now >= g.lobbyEndsAt) {
    g.phase = "over";
    g.endReason = "lobby";

    return "lobby-closed";
  }

  const s = g.seats[g.turn];

  if (g.phase !== "playing" || now < g.turnEndsAt || !s) return null;

  const idle = s.idle + 1;

  if (idle >= MAX_IDLE) {
    dropSeat(g, g.turn, now);
    g.lastMove = `${s.name} was dropped after ${MAX_IDLE} timeouts`;

    return "dropped";
  }

  autoMove(g, s, { userId: s.userId, turnNo: g.turnNo, now, random });
  s.idle = idle;
  g.lastMove = `${g.lastMove} (time ran out)`;

  return "timed-out";
}
