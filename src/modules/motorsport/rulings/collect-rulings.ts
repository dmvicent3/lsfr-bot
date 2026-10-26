import type { FiaDocument, FiaPage, RulingDeps, RulingRun } from "./types.ts";
import type { EventSchedule } from "../types.ts";
import type { FetchFn } from "../../../core/types.ts";
import { log } from "../../../core/log.ts";
import type { MotorsportRepo } from "../repo.ts";
import { resultKind } from "../results/results.ts";
import {
  isPenalty,
  isPostSession,
  matchesEvent,
  renderRuling,
  rulingFile,
  rulingsEvent,
  summaryPrompt,
} from "./rulings.ts";
import { FIA_DOCUMENTS, isRuling, parseFiaDocuments } from "./fia.ts";
import { parseRuling } from "./ruling.ts";

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
  if (!repo.followed.get("f1")) return;

  const event = rulingsEvent(repo.sessions.list("f1"), now);

  if (!event) return;

  const page = parseFiaDocuments(await (await download(FIA_DOCUMENTS, deps.fetchFn)).text());

  if (!matchesEvent(page.event, event.eventName)) return;

  const run = { repo, now, deps, event };

  for (const doc of freshRulings(page, event, repo.rulings.handled("f1"))) {
    try {
      await handleRuling(run, doc);
    } catch (err) {
      log.error("motorsport:rulings", doc.title, err);
    }
  }
}

/** Unhandled ruling documents published after the weekend's first result session, oldest first. */
function freshRulings(page: FiaPage, event: EventSchedule, handled: Set<string>): FiaDocument[] {
  const opens = Math.min(
    ...event.sessions
      .filter((s) => resultKind(s.series, s.sessionId) !== null)
      .map((s) => s.end.getTime()),
  );

  return page.documents
    .filter((d) => isRuling(d.title) && !handled.has(d.url) && d.publishedAt.getTime() > opens)
    .toSorted((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
}

/** Posts one document if it is a post-session ruling; either way it is marked handled. */
async function handleRuling(
  { repo, now, deps, event }: RulingRun,
  doc: FiaDocument,
): Promise<void> {
  const pdf = new Uint8Array(await (await download(doc.url, deps.fetchFn)).arrayBuffer());
  const text = await deps.pdfText(pdf);
  const ruling = parseRuling(text);
  const mark = { eventId: event.eventId, url: doc.url, now };

  if (!ruling || !isPostSession(ruling.session, doc.publishedAt, event.sessions)) {
    repo.rulings.mark("f1", { ...mark, posted: false });

    return;
  }

  const penalty = isPenalty(ruling.decision);
  const summary = penalty ? await summaryOf(summaryPrompt(ruling), deps) : null;
  const target = {
    series: "f1",
    eventId: event.eventId,
    eventName: event.eventName,
    place: "thread",
  } as const;
  await deps.post(target, {
    content: renderRuling(ruling, summary),
    files: penalty ? [rulingFile(doc.title, text)] : [],
  });
  repo.rulings.mark("f1", { ...mark, posted: true });
}
