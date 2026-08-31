// PostgREST `.or()` filter strings parse `,()` as structure and `%_\` as
// LIKE wildcards — strip/escape them so user search input stays literal.
export function escapeSearchTerm(q: string): string {
  return q.replace(/[,()]/g, " ").replace(/[\\%_]/g, "\\$&").trim();
}

// figma_url is rendered as a clickable link — only accept real Figma https
// URLs so a javascript:/data: value can never become an XSS vector.
export function isValidFigmaUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      (u.hostname === "figma.com" || u.hostname.endsWith(".figma.com"))
    );
  } catch {
    return false;
  }
}
