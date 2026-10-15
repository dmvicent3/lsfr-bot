import type { FetchFn } from "../../core/guards.ts";
import { log } from "../../core/log.ts";
import type { Post } from "./post.ts";
import type { MotorsportRepo } from "./repo.ts";
import { resultKind } from "./results.ts";
import {
  isPenalty,
  isPostSession,
  matchesEvent,
  renderRuling,
  rulingFile,
  rulingsEvent,
  summaryPrompt,
} from "./rulings.ts";
import { FIA_DOCUMENTS, isRuling, parseFiaDocuments, parseRuling } from "./sources/fia.ts";

export interface RulingDeps {
  fetchFn: FetchFn;
  /** A PDF's text, laid out (pdftotext -layout). */
  pdfText: (pdf: Uint8Array) => Promise<string>;
  /** Gemini; may throw (down, out of quota), and then the ruling posts without it. */
  summarize: (prompt: string) => Promise<string>;
  post: Post;
}

const USER_AGENT = { "user-agent": "Mozilla/5.0 (compatible; Gork Discord bot)" };

async function download(url: string, fetchFn: FetchFn): Promise<Response> {
  const res = await fetchFn(url, { headers: USER_AGENT, signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res;
}

async function summaryOf(prompt: string, deps: RulingDeps): Promise<string | null> {
  try {
    return await deps.summarize(prompt);
  } catch (err) {
    log.error("motorsport:rulings", "summary failed, posting without one", err);
    return null;
  }
}

/**
 * During an F1 weekend's rulings window, posts each new stewards' ruling that came out after
 * the session it is about, in the weekend thread. Documents that aren't such a ruling are
 * remembered so they're downloaded once; a ruling that fails (download, post) is retried.
 */
export async function collectRulings(
  repo: MotorsportRepo,
  now: number,
  deps: RulingDeps,
): Promise<void> {
  if (!repo.getFollowed("f1")) return;
  const event = rulingsEvent(repo.listSessions("f1"), now);
  if (!event) return;
  const page = parseFiaDocuments(await (await download(FIA_DOCUMENTS, deps.fetchFn)).text());
  if (!matchesEvent(page.event, event.eventName)) return;
  const opens = Math.min(
    ...event.sessions
      .filter((s) => resultKind(s.series, s.sessionId) !== null)
      .map((s) => s.end.getTime()),
  );
  const handled = repo.handledRulings("f1");
  const fresh = page.documents
    .filter((d) => isRuling(d.title) && !handled.has(d.url) && d.publishedAt.getTime() > opens)
    .toSorted((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
  const target = {
    series: "f1",
    eventId: event.eventId,
    eventName: event.eventName,
    place: "thread",
  } as const;
  for (const doc of fresh) {
    try {
      const pdf = new Uint8Array(await (await download(doc.url, deps.fetchFn)).arrayBuffer());
      const text = await deps.pdfText(pdf);
      const ruling = parseRuling(text);
      if (!ruling || !isPostSession(ruling.session, doc.publishedAt, event.sessions)) {
        repo.markRuling("f1", event.eventId, doc.url, false, now);
        continue;
      }
      const penalty = isPenalty(ruling.decision);
      const summary = penalty ? await summaryOf(summaryPrompt(ruling), deps) : null;
      await deps.post(target, {
        content: renderRuling(ruling, summary),
        files: penalty ? [rulingFile(doc.title, text)] : [],
      });
      repo.markRuling("f1", event.eventId, doc.url, true, now);
    } catch (err) {
      log.error("motorsport:rulings", doc.title, err);
    }
  }
}
