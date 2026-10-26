import type { APIEmbed } from "discord.js";
import type { Chapter, MangaInfo } from "../api/types.ts";
import { chunkMentions, mentionText } from "./mentions.ts";
import type { Post, PostMessage } from "./types.ts";

const COLOR = 16742144;

function heading(chapters: Chapter[], newest: Chapter): string {
  const first = chapters[0];

  if (chapters.length > 1 && first) return `Ch.${first.number}–${newest.number}`;

  return newest.number === null ? "Oneshot" : `Ch.${newest.number}`;
}

function description(chapters: Chapter[], newest: Chapter, manga: MangaInfo): string {
  const lead = chapters.length > 1 ? `${chapters.length} chapters` : newest.title;
  const lines = [
    lead,
    `Author: ${manga.author ?? "Unknown"}`,
    `Group: ${newest.group ?? "No Group"}`,
  ];

  return lines.filter((l) => l !== null && l !== "").join("\n");
}

/** The old script's embed: orange, cover thumbnail, linking the (newest) chapter. */
function embed(post: Post, manga: MangaInfo): APIEmbed {
  const newest = post.chapters.at(-1);

  if (!newest) throw new Error("a post without chapters");

  return {
    title: `${heading(post.chapters, newest)} - ${manga.title}`.slice(0, 256),
    description: description(post.chapters, newest, manga),
    url: newest.externalUrl ?? `https://mangadex.org/chapter/${newest.id}`,
    color: COLOR,
    footer: { text: "New update available" },
    timestamp: newest.readableAt,
    ...(manga.coverFile && {
      thumbnail: {
        url: `https://uploads.mangadex.org/covers/${manga.id}/${manga.coverFile}.256.jpg`,
      },
    }),
  };
}

/** The post's messages: the embed with the first mentions, then the remaining mentions. */
export function renderPost(post: Post, manga: MangaInfo, followers: string[]): PostMessage[] {
  const chunks = chunkMentions(followers);
  const [first = [], ...rest] = chunks;

  return [
    {
      content: mentionText(first),
      allowedMentions: { users: first },
      embeds: [embed(post, manga)],
    },
    ...rest.map((ids) => ({ content: mentionText(ids), allowedMentions: { users: ids } })),
  ];
}
