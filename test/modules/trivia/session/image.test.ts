import { expect, test } from "bun:test";
import type { FetchFn } from "../../../../src/core/types.ts";
import { downloadPicture } from "../../../../src/modules/trivia/session/image.ts";

const serving =
  (type: string, status = 200, size = 4): FetchFn =>
  async () =>
    new Response(new Uint8Array(size), { status, headers: { "content-type": type } });

test("png, jpeg and gif come back named by type", async () => {
  expect((await downloadPicture("Flag.svg", serving("image/png")))?.name).toBe("picture.png");
  expect((await downloadPicture("Photo.jpg", serving("image/jpeg")))?.name).toBe("picture.jpg");
  expect((await downloadPicture("Anim.gif", serving("image/gif")))?.name).toBe("picture.gif");
});

test("the request goes to the Commons thumbnail with the builder's user agent", async () => {
  const seen: { url: string; ua: string | null }[] = [];

  const fetchFn: FetchFn = async (url, init) => {
    seen.push({ url, ua: new Headers(init?.headers).get("user-agent") });

    return new Response(new Uint8Array(4), { headers: { "content-type": "image/png" } });
  };

  await downloadPicture("Flag of Portugal.svg", fetchFn);

  expect(seen).toEqual([
    {
      url: "https://commons.wikimedia.org/wiki/Special:FilePath/Flag%20of%20Portugal.svg?width=640",
      ua: "GorkTriviaBuilder/1.0 (Gork Discord bot)",
    },
  ]);
});

const throwing: FetchFn = async () => {
  throw new Error("down");
};

test("another type, an error status, a huge file or a throw give nothing", async () => {
  expect(await downloadPicture("x", serving("text/html"))).toBeNull();
  expect(await downloadPicture("x", serving("image/png", 404))).toBeNull();
  expect(await downloadPicture("x", serving("image/png", 200, 8 * 1024 * 1024 + 1))).toBeNull();
  expect(await downloadPicture("x", throwing)).toBeNull();
});
