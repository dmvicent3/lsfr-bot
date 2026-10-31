import { type Game, LOBBY_MS, type Seat, type Who } from "./types.ts";

export const seat = (who: Who): Seat => ({
  ...who,
  hand: [],
  idle: 0,
  place: null,
  dropped: false,
  catchable: false,
});

/** The table before the deal: no cards, no turn yet. */
const emptyTable = (): Pick<
  Game,
  | "turn"
  | "direction"
  | "turnNo"
  | "turnEndsAt"
  | "draw"
  | "discard"
  | "colour"
  | "pending"
  | "step"
  | "drawn"
  | "lastMove"
  | "nextPlace"
> => ({
  turn: 0,
  direction: 1,
  turnNo: 0,
  turnEndsAt: 0,
  draw: [],
  discard: [],
  colour: null,
  pending: null,
  step: "play",
  drawn: null,
  lastMove: "",
  nextPlace: 1,
});

export function newGame(init: {
  id: number;
  guildId: string;
  channelId: string;
  starter: Who;
  stacking: boolean;
  now: number;
}): Game {
  return {
    id: init.id,
    guildId: init.guildId,
    channelId: init.channelId,
    startedBy: init.starter.userId,
    stacking: init.stacking,
    phase: "lobby",
    endReason: null,
    seats: [seat(init.starter)],
    lobbyEndsAt: init.now + LOBBY_MS,
    ...emptyTable(),
  };
}
