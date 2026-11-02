/** "45s", "23m 10s" or "1h 4m". */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);

  if (h > 0) return `${h}h ${m}m`;

  return m > 0 ? `${m}m ${total % 60}s` : `${total}s`;
}
