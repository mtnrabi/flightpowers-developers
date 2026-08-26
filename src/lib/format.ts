/**
 * Display normalizers for raw upstream strings. Fixtures and live responses
 * are never mutated — these shape presentation only.
 */

/**
 * Google renders the operating-carrier clause as its own line, and the
 * upstream join loses the line break: "LOTOperated by Electra Airways".
 * Split the clause out so the UI can style it as a secondary line.
 */
export function splitAirline(raw: string): { main: string; operatedBy: string | null } {
  const m = /^(.*?)\s*Operated by\s+(.+)$/s.exec(raw);
  if (!m || m[1]!.trim() === '') return { main: raw, operatedBy: null };
  return { main: m[1]!.trim(), operatedBy: m[2]!.trim() };
}

/** Plain-text form for narratives: "LOT (operated by Electra Airways)". */
export function airlineText(raw: string): string {
  const { main, operatedBy } = splitAirline(raw);
  return operatedBy ? `${main} (operated by ${operatedBy})` : main;
}
