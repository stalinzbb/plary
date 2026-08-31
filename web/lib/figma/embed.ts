export function buildEmbedUrl(
  figmaUrl: string | null,
  fileKey?: string | null,
  nodeId?: string | null,
  kind: "prototype" | "screen" = "screen",
): string | null {
  // client-id is optional for Embed Kit 2.0 — never block the embed on it
  const clientId = process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID;

  // Prefer the saved figma_url. Fall back to constructing from fileKey + nodeId.
  let sourceUrl = figmaUrl;
  if (!sourceUrl && fileKey) {
    const nodeParam = nodeId ? `?node-id=${nodeId.replace(":", "-")}` : "";
    sourceUrl = `https://www.figma.com/proto/${fileKey}/untitled${nodeParam}`;
  }
  if (!sourceUrl) return null;

  try {
    const url = new URL(sourceUrl);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const typeIndex = pathParts.findIndex(
      (p) => p === "file" || p === "proto" || p === "design",
    );
    if (typeIndex === -1) return null;

    const extractedKey = pathParts[typeIndex + 1];
    const fileName = pathParts[typeIndex + 2] ?? "untitled";
    if (!extractedKey) return null;

    // Embed Kit 2.0: embed.figma.com/proto plays prototypes interactively;
    // embed.figma.com/design shows the canvas for static screens.
    // (The legacy www.figma.com/embed?type=design wrapper rendered design
    // view even for prototypes, so they never played.)
    // A /proto/ source URL is a prototype even if the record says "screen"
    // (kind detection was broken in older saves)
    const isProto = kind === "prototype" || pathParts[typeIndex] === "proto";
    const path = isProto ? "proto" : "design";
    const embed = new URL(
      `https://embed.figma.com/${path}/${extractedKey}/${fileName}`,
    );

    const existingNodeId = url.searchParams.get("node-id");
    const resolvedNodeId = existingNodeId ?? nodeId?.replace(":", "-") ?? null;
    if (resolvedNodeId) {
      embed.searchParams.set("node-id", resolvedNodeId);
      if (isProto) {
        embed.searchParams.set("starting-point-node-id", resolvedNodeId);
      }
    }
    if (isProto) {
      embed.searchParams.set("scaling", "scale-down-width");
      embed.searchParams.set("hide-ui", "1");
    }
    embed.searchParams.set("embed-host", "plary");
    if (clientId) embed.searchParams.set("client-id", clientId);

    return embed.toString();
  } catch {
    return null;
  }
}
