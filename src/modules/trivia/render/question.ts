import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  type APIEmbed,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import { mask } from "../hint.ts";
import type { ButtonRound, TypedRound } from "../rounds/types.ts";
import type { Question } from "../types.ts";

type ButtonRow = APIActionRowComponent<APIButtonComponentWithCustomId>;

const LETTERS = ["A", "B", "C", "D"];
const MAX_LABEL = 80;

const title = (q: Question, extra: string[] = []): string =>
  [`#${q.id}`, q.category, q.difficulty, ...extra].join(" · ");

const footer = (topicBy: string | null): Pick<APIEmbed, "footer"> =>
  topicBy ? { footer: { text: `Topic picked by ${topicBy}` } } : {};

const picture = (imageName: string | null): Pick<APIEmbed, "image"> =>
  imageName ? { image: { url: `attachment://${imageName}` } } : {};

function typedStatus(r: TypedRound): string {
  if (r.closedAt === null) return `HINT: \`${mask(r.question.answer, r.order, r.level)}\``;

  if (r.award) return `Answer: **${r.question.answer}**`;

  return `Time's up — the answer was: **${r.question.answer}**`;
}

export function typedMessage(
  r: TypedRound,
  topicBy: string | null,
  imageName: string | null,
): { embeds: APIEmbed[] } {
  const description = `${r.question.question}\n\n${typedStatus(r)}`;
  const embed = {
    title: title(r.question),
    description,
    ...footer(topicBy),
    ...picture(imageName),
  };

  return { embeds: [embed] };
}

function closedStyle(r: ButtonRound, index: number): ButtonStyle.Success | ButtonStyle.Secondary {
  return index === r.right ? ButtonStyle.Success : ButtonStyle.Secondary;
}

function button(r: ButtonRound, option: string, index: number): APIButtonComponentWithCustomId {
  const closed = r.closedAt !== null;
  const count = closed ? ` · ${r.picks.filter((p) => p.index === index).length}` : "";
  const text = `${LETTERS[index]}: ${option}`.slice(0, MAX_LABEL - count.length);

  return {
    type: ComponentType.Button,
    custom_id: `trivia:pick:${r.id}:${index}`,
    label: `${text}${count}`,
    style: closed ? closedStyle(r, index) : ButtonStyle.Primary,
    disabled: closed,
  };
}

export function buttonMessage(
  r: ButtonRound,
  topicBy: string | null,
  imageName: string | null,
): { embeds: APIEmbed[]; components: ButtonRow[] } {
  const embed = {
    title: title(r.question, ["20s"]),
    description: r.question.question,
    ...footer(topicBy),
    ...picture(imageName),
  };
  const components = r.options.map((option, i) => button(r, option, i));

  return { embeds: [embed], components: [{ type: ComponentType.ActionRow, components }] };
}
