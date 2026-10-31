import { ButtonStyle, escapeMarkdown } from "discord.js";
import { active } from "../game/order.ts";
import { points } from "../game/points.ts";
import type { Game, Seat } from "../game/types.ts";
import type { Outgoing } from "../../trivia/session/types.ts";
import { TITLE, button, nameAt, rows } from "./parts.ts";
import { arrow, placeLabel, topLabel } from "./text.ts";

const cards = (n: number): string => `${n} card${n === 1 ? "" : "s"}`;

/** Seconds left on the turn, rounded up to 10 s. */
const secondsLeft = (g: Game, now: number): number =>
  Math.max(0, Math.ceil((g.turnEndsAt - now) / 10_000) * 10);

function seatLine(g: Game, s: Seat, i: number, now: number): string {
  const name = escapeMarkdown(s.name);

  if (s.dropped) return `~~${name}~~`;

  if (s.place !== null) return `${placeLabel(s.place)} ${name}`;

  if (i === g.turn) return `▶ **${name}** — ${cards(s.hand.length)} · ${secondsLeft(g, now)} s`;

  return `${name} — ${cards(s.hand.length)}`;
}

function playing(g: Game, now: number): string {
  const waiting = g.pending ? [`**+${g.pending.total} waiting on ${nameAt(g, g.turn)}**`] : [];

  return [
    `## ${topLabel(g)}`,
    `Direction ${arrow(g)}`,
    ...waiting,
    g.seats.map((s, i) => seatLine(g, s, i, now)).join("\n"),
    g.lastMove ? `_${escapeMarkdown(g.lastMove)}_` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function finished(g: Game): string {
  if (g.endReason === "lobby") return "The lobby closed before the game started.";

  if (g.endReason === "stop") return "The game was stopped. No points this time.";

  if (g.endReason === "lost") return "The game ended when the bot restarted. No points this time.";

  const pts = new Map(points(g).map((r) => [r.userId, r.points]));
  const placed = g.seats
    .filter((s) => s.place !== null)
    .toSorted((a, b) => (a.place ?? 0) - (b.place ?? 0))
    .map(
      (s) =>
        `${placeLabel(s.place ?? 0)} ${escapeMarkdown(s.name)} — ${pts.get(s.userId) ?? 0} pts`,
    );
  const dropped = g.seats.filter((s) => s.dropped).map((s) => `~~${escapeMarkdown(s.name)}~~`);

  return [...placed, ...dropped].join("\n");
}

/** The public board: the top card, the seats and the last move; final places once it's over. */
export function boardMessage(g: Game, now: number): Outgoing {
  if (g.phase === "over")
    return {
      embeds: [{ title: `${TITLE} — game over`, description: finished(g) }],
      components: [],
    };

  const catchable = active(g).some((s) => s.catchable);
  const buttons = [
    button("shed:hand", "My hand", ButtonStyle.Primary),
    ...(catchable ? [button(`shed:catch:${g.turnNo}`, "Catch!", ButtonStyle.Danger)] : []),
    button("shed:quit", "Leave"),
  ];

  return { embeds: [{ title: TITLE, description: playing(g, now) }], components: rows(buttons) };
}
