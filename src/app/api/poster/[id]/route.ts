import { createHash } from "node:crypto";
import { getMatch } from "@/lib/domain";

/**
 * Serves a match poster as a real, cacheable image instead of inlining a
 * base64 data URL into every Arena / Matches page. Data URLs are decoded to
 * binary; external URLs redirect. An ETag lets browsers revalidate cheaply,
 * and a short max-age avoids re-fetching on rapid navigation.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const match = getMatch(Number(id));
  const url = match?.image_url;
  if (!url) return new Response("Not found", { status: 404 });

  if (!url.startsWith("data:")) {
    return Response.redirect(url, 302);
  }

  const m = /^data:([^;,]+)?(;base64)?,([\s\S]*)$/.exec(url);
  if (!m) return new Response("Unsupported image", { status: 415 });
  const mime = m[1] || "application/octet-stream";
  const body = m[2] ? Buffer.from(m[3], "base64") : Buffer.from(decodeURIComponent(m[3]), "utf8");

  const etag = `"${createHash("sha1").update(body).digest("hex").slice(0, 16)}"`;
  const cache = "public, max-age=300, stale-while-revalidate=86400";

  if (_req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": cache } });
  }

  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(body.length),
      "Cache-Control": cache,
      ETag: etag,
    },
  });
}
