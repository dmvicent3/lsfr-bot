import type { Report } from "../store/types.ts";
import type { KaosList, Question } from "../types.ts";

/** The most reports one reply lists, to stay inside a message. */
const MAX_REPORTS = 10;
const ITEM_CHARS = 120;

export const reportedLabel = (r: Pick<Report, "kind" | "itemId">): string =>
  r.kind === "kaos" ? `#${r.itemId} KAOS` : `#${r.itemId}`;

function itemText(
  r: Report,
  lookup: { questions: readonly Question[]; lists: readonly KaosList[] },
): string {
  if (r.kind === "kaos") {
    const list = lookup.lists.find((l) => l.id === r.itemId);

    return list ? `${list.prompt} — ${list.items.map((i) => i.answer).join(", ")}` : "(gone)";
  }

  const q = lookup.questions.find((x) => x.id === r.itemId);

  return q ? `${q.question} → ${q.answer}` : "(gone)";
}

/** One line per report: the item, its answer(s), the reason and who flagged it. */
export function renderReports(
  reports: Report[],
  lookup: { questions: readonly Question[]; lists: readonly KaosList[] },
): string {
  if (reports.length === 0) return "No reports.";

  return reports
    .slice(0, MAX_REPORTS)
    .map((r) => {
      const reason = r.reason ? ` — “${r.reason}”` : "";

      return `**${reportedLabel(r)}** ${itemText(r, lookup).slice(0, ITEM_CHARS)}${reason} (by <@${r.userId}>)`;
    })
    .join("\n");
}
