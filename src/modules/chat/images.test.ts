import { describe, expect, test } from "bun:test";
import type { FetchFn } from "../../core/guards.ts";
import {
  downloadImages,
  type ImageRef,
  imageNotes,
  MAX_IMAGE_BYTES,
  selectImages,
} from "./images.ts";

const img = (url: string, size = 1000, contentType: string | null = "image/png"): ImageRef => ({
  url,
  size,
  contentType,
});

describe("selectImages", () => {
  test("newest message first (attachment order within one), at most 4; oversized and non-images skipped", () => {
    const chain = [
      [img("old1"), img("old2")],
      [img("doc", 10, "application/pdf"), img("big", MAX_IMAGE_BYTES + 1)],
      [img("new1"), img("new2"), img("new3")],
    ];
    const { chosen, skipped } = selectImages(chain);
    expect(chosen.map((r) => r.url)).toEqual(["new1", "new2", "new3", "old1"]);
    // old2 over the cap, big over the size limit; the PDF isn't an image at all.
    expect(skipped).toBe(2);
  });

  test("GIFs and unknown types aren't sent (Gemini can't read them)", () => {
    const { chosen, skipped } = selectImages([[img("a.gif", 10, "image/gif"), img("x", 10, null)]]);
    expect(chosen).toEqual([]);
    expect(skipped).toBe(1);
  });
});

const someGone: FetchFn = async (url) =>
  url === "ok" ? new Response("ABC") : new Response("", { status: 404 });
const oversized: FetchFn = async () => new Response(new Uint8Array(MAX_IMAGE_BYTES + 1));
const offline: FetchFn = async () => {
  throw new Error("reset");
};

describe("downloadImages", () => {
  test("base64 per image; a failed download is null", async () => {
    const images = await downloadImages([img("ok", 3, "image/jpeg"), img("gone")], someGone);
    expect(images).toEqual([{ mimeType: "image/jpeg", data: "QUJD" }, null]);
  });

  test("a download bigger than it claimed is dropped", async () => {
    expect(await downloadImages([img("liar", 10)], oversized)).toEqual([null]);
  });

  test("a network error is null too", async () => {
    expect(await downloadImages([img("x")], offline)).toEqual([null]);
  });
});

test("notes for skipped and failed images", () => {
  expect(imageNotes(0, 0)).toBe("");
  expect(imageNotes(2, 0)).toBe("\n-# Skipped 2 images (max 4 per message, 10 MB each, no GIFs).");
  expect(imageNotes(0, 1)).toBe("\n-# Couldn't load 1 image, answered without it.");
});
