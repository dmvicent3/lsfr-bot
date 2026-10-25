import { expect, test } from "bun:test";
import { parseRuling } from "../../../../src/modules/motorsport/rulings/ruling.ts";
import { pdfText } from "../../../../src/modules/motorsport/rulings/pdf.ts";

const fixture = new URL("../testing/fixtures/fia-ruling.pdf", import.meta.url);

// pdftotext comes from poppler-utils (in the Docker image); skipped where it isn't installed.
test.skipIf(!Bun.which("pdftotext"))("a ruling PDF as laid-out text", async () => {
  const text = await pdfText(await Bun.file(fixture).bytes());
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
