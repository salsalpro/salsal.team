import { get } from "@vercel/blob";
import { getSession } from "@/lib/authorization";
import { query } from "@/lib/db";
import { isPublishedArticleImage } from "@/lib/repository";
import { failure, type IdContext } from "../../_utils";
export const runtime = "nodejs";
export async function GET(request: Request, context: IdContext) {
  const deny = () =>
    new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  try {
    const { id } = await context.params;
    if (!/^[a-f0-9-]{36}$/.test(id)) return deny();
    const src = `/api/blog-images/${id}`;
    // Inspect actual typed image references; a URL mentioned in prose does not make it public.
    const published = await isPublishedArticleImage(src);
    if (
      !published &&
      (await getSession(request.headers))?.user.role !== "ADMIN"
    )
      return deny();
    const image = (
      await query<{ pathname: string }>(
        "SELECT pathname FROM blog_image WHERE id=$1",
        [id],
      )
    ).rows[0];
    if (!image || !process.env.BLOB_READ_WRITE_TOKEN) return deny();
    const blob = await get(image.pathname, {
      access: "private",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!blob || blob.statusCode !== 200) return deny();
    return new Response(blob.stream, {
      headers: {
        "Content-Type": "image/webp",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
