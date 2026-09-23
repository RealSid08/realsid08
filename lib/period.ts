/** Latest four-digit year mentioned in a period string, e.g. "May 2025 – Oct 2025" → 2025. */
export const latestYear = (value?: string): number | undefined => {
  if (!value) return undefined;
  const matches = value.match(/(?:19|20)\d{2}/g);
  return matches && matches.length > 0 ? Number(matches[matches.length - 1]) : undefined;
};
