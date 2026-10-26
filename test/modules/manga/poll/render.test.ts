import { describe, expect, test } from "bun:test";
import type { Chapter, MangaInfo } from "../../../../src/modules/manga/api/types.ts";
import { renderPost } from "../../../../src/modules/manga/poll/render.ts";
import type { Post } from "../../../../src/modules/manga/poll/types.ts";

const manga: MangaInfo = {
  id: "m1",
  title: "Frieren",
  latestUpload: "c42",
  coverFile: "cover.jpg",
  author: "Yamada Kanehito",
};

function ch(over: Partial<Chapter> = {}): Chapter {
  return {
    id: "c42",
    mangaId: "m1",
    number: "42",
    title: "The North",
    group: "Fern Scans",
    externalUrl: null,
    readableAt: "2026-10-26T10:00:00+00:00",
    ...over,
  };
}

const post = (chapters: Chapter[]): Post => ({ chapters, highest: 42, unnumberedId: null });
const embedOf = (p: Post, m: MangaInfo = manga) => renderPost(p, m, ["u1"])[0]?.embeds?.[0];

describe("renderPost", () => {
  test("one chapter: the old script's embed, pinging the followers only", () => {
    const [message] = renderPost(post([ch()]), manga, ["u1", "u2"]);
    expect(message).toEqual({
      content: "<@u1> <@u2>",
      allowedMentions: { users: ["u1", "u2"] },
      embeds: [
        {
          title: "Ch.42 - Frieren",
          description: "The North\nAuthor: Yamada Kanehito\nGroup: Fern Scans",
          url: "https://mangadex.org/chapter/c42",
          color: 16742144,
          footer: { text: "New update available" },
          timestamp: "2026-10-26T10:00:00+00:00",
          thumbnail: { url: "https://uploads.mangadex.org/covers/m1/cover.jpg.256.jpg" },
        },
      ],
    });
  });

  test("no group, no chapter title, unknown author", () => {
    const embed = embedOf(post([ch({ group: null, title: null })]), { ...manga, author: null });
    expect(embed?.description).toBe("Author: Unknown\nGroup: No Group");
  });

  test("an external chapter links out; no cover, no thumbnail", () => {
    const embed = embedOf(post([ch({ externalUrl: "https://mangaplus/x" })]), {
      ...manga,
      coverFile: null,
    });
    expect(embed?.url).toBe("https://mangaplus/x");
    expect(embed).not.toHaveProperty("thumbnail");
  });

  test("a collapsed post names the range and links the newest", () => {
    const chapters = ["38", "39", "40", "41", "42", "43"].map((n) =>
      ch({ id: `c${n}`, number: n, readableAt: `2026-10-26T${n}:00:00+00:00` }),
    );
    const embed = embedOf(post(chapters));
    expect(embed?.title).toBe("Ch.38–43 - Frieren");
    expect(embed?.description).toBe("6 chapters\nAuthor: Yamada Kanehito\nGroup: Fern Scans");
    expect(embed?.url).toBe("https://mangadex.org/chapter/c43");
  });

  test("a oneshot", () => {
    expect(embedOf(post([ch({ number: null })]))?.title).toBe("Oneshot - Frieren");
  });

  test("mentions in a title stay text; only followers are allowed", () => {
    const [message] = renderPost(post([ch({ title: "@everyone <@&123>" })]), manga, ["u1"]);
    expect(message?.allowedMentions).toEqual({ users: ["u1"] });
  });

  test("many followers: the embed goes with the first chunk, the rest follow", () => {
    const many = Array.from({ length: 150 }, (_, k) => `1${String(k).padStart(18, "0")}`);
    const messages = renderPost(post([ch()]), manga, many);
    expect(messages.length).toBeGreaterThan(1);
    expect(messages[0]?.embeds).toHaveLength(1);
    expect(messages[1]).not.toHaveProperty("embeds");
  });
});
