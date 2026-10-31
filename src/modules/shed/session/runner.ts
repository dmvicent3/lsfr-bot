import { catchOut } from "../game/catch.ts";
import { advance } from "../game/clock.ts";
import { drawOne, keepDrawn, passDrawn } from "../game/draw.ts";
import { join, leaveLobby, startGame, toggleStacking } from "../game/lobby.ts";
import { pickColour } from "../game/paint.ts";
import { playCards } from "../game/play.ts";
import { quitGame } from "../game/quit.ts";
import type { Who } from "../game/types.ts";
import { secondsLeft } from "../render/board.ts";
import { type HandView, handView } from "../render/hand.ts";
import { openMessage, refresh } from "./flow.ts";
import { Session, type Turn } from "./session.ts";
import type { KeepClick, PaintClick, PlayClick, TurnClick } from "./types.ts";

/** One live game: its clock, its clicks and stop. */
export class Runner extends Session {
  open(now = Date.now()): Promise<void> {
    return this.run(now, () => openMessage(this.live, this.deps, now));
  }

  /** The clock (lobby close, turn timeouts), then at most one board edit. */
  tick(now: number): Promise<void> {
    return this.run(now, async () => {
      const g = this.live.game;
      this.live.dirty ||= advance(g, now, this.deps.random) !== null;
      this.live.dirty ||= g.phase === "playing" && secondsLeft(g, now) !== this.live.shownSeconds;

      if (this.live.game.phase !== "over") await refresh(this.live, this.deps, now);
    });
  }

  onJoin(who: Who, elsewhere: boolean): Promise<ReturnType<typeof join>> {
    return this.change(Date.now(), (g) => join(g, who, elsewhere));
  }

  onLeave(userId: string): Promise<ReturnType<typeof leaveLobby>> {
    return this.change(Date.now(), (g) => leaveLobby(g, userId));
  }

  onStacking(userId: string): Promise<ReturnType<typeof toggleStacking>> {
    return this.change(Date.now(), (g) => toggleStacking(g, userId));
  }

  /** Deals, and turns the lobby message into the board at once. */
  onStart(userId: string, now: number): Promise<ReturnType<typeof startGame>> {
    return this.run(now, async () => {
      const out = startGame(this.live.game, userId, now, this.deps.random);

      if (out === "started") await refresh(this.live, this.deps, now, true);

      return out;
    });
  }

  onHand(userId: string, page: number): Promise<HandView> {
    return this.run(Date.now(), async () => handView(this.live.game, userId, page));
  }

  onPlay(c: PlayClick): Turn<ReturnType<typeof playCards>> {
    return this.turn(c, playCards);
  }

  onDraw(c: TurnClick): Turn<ReturnType<typeof drawOne>> {
    return this.turn(c, drawOne);
  }

  onKeep(c: KeepClick): Turn<ReturnType<typeof keepDrawn>> {
    return this.turn(c, keepDrawn);
  }

  onPass(c: TurnClick): Turn<ReturnType<typeof passDrawn>> {
    return this.turn(c, passDrawn);
  }

  onPaint(c: PaintClick): Turn<ReturnType<typeof pickColour>> {
    return this.turn(c, pickColour);
  }

  onCatch(userId: string): Promise<ReturnType<typeof catchOut>> {
    return this.change(Date.now(), (g) => catchOut(g, { userId, random: this.deps.random }));
  }

  onQuit(userId: string, now: number): Promise<ReturnType<typeof quitGame>> {
    return this.change(now, (g) => quitGame(g, userId, now));
  }

  /** Ends the game with no points (the final board follows in `run`). */
  stop(now: number): Promise<void> {
    return this.run(now, async () => {
      if (this.live.game.phase === "over") return;

      this.live.game.phase = "over";
      this.live.game.endReason = "stop";
    });
  }
}
