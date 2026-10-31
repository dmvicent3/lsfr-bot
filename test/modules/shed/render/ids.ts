/** Every custom ID on a message or hand view, row by row. */
export const ids = (m: { components?: unknown }): string[] => rowsOf(m).flat();

/** The custom IDs of each button row. */
export const rowsOf = (m: { components?: unknown }): string[][] =>
  JSON.parse(JSON.stringify(m.components ?? [])).map(
    (row: { components: { custom_id: string }[] }) => row.components.map((c) => c.custom_id),
  );

/** The label of the button with this custom ID. */
export const labelOf = (m: { components?: unknown }, id: string): string | undefined =>
  JSON.parse(JSON.stringify(m.components ?? []))
    .flatMap((row: { components: { custom_id: string; label: string }[] }) => row.components)
    .find((c: { custom_id: string }) => c.custom_id === id)?.label;

export const text = (m: { content?: string | null; embeds?: unknown }): string =>
  `${m.content ?? ""}${JSON.stringify(m.embeds ?? [])}`;
