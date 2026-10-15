import { expect, test } from "bun:test";
import { parseRuling } from "./fia.ts";
import { pdfText } from "./pdf.ts";

const fixture = new URL("./fixtures/fia-ruling.pdf", import.meta.url);

// pdftotext comes from poppler-utils (in the Docker image); skipped where it isn't installed.
test.skipIf(!Bun.which("pdftotext"))("a ruling PDF as laid-out text", async () => {
  const text = await pdfText(await Bun.file(fixture).bytes());
  expect(text).toContain("No / Driver 23 - Alexander Albon");
  expect(text).toMatch(/^Session\s+Sprint$/m);
  // Whichever pdftotext build is installed, its layout must parse.
  expect(parseRuling(text)).toMatchObject({
    car: "23",
    session: "Sprint",
    decision: "No Penalty is applied",
  });
});

test.skipIf(!Bun.which("pdftotext"))("not a PDF is an error", async () => {
  expect(pdfText(new TextEncoder().encode("hello"))).rejects.toThrow("pdftotext");
});
