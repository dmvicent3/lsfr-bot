import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * A PDF's text with its layout kept (labels and values on one line), via pdftotext. Goes
 * through a temp file: not every pdftotext build reads a PDF from stdin.
 */
export async function pdfText(pdf: Uint8Array): Promise<string> {
  const path = join(tmpdir(), `gork-${crypto.randomUUID()}.pdf`);
  await Bun.write(path, pdf);
  try {
    const proc = Bun.spawn(["pdftotext", "-enc", "UTF-8", "-layout", path, "-"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const [text, errors, code] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
      proc.exited,
    ]);
    if (code !== 0) throw new Error(`pdftotext exited with ${code}: ${errors.trim()}`);
    return text;
  } finally {
    await rm(path, { force: true });
  }
}
