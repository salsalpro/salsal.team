import { randomUUID } from "node:crypto";
import { put } from "@vercel/blob";
import { ApiError, requireApiUser, verifyOrigin } from "@/lib/authorization";
import { query } from "@/lib/db";
import { prepareArticleImage, readArticleUpload } from "@/lib/article-upload";
import { failure } from "../../../_utils";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    await requireApiUser(request, true);
    const image = await prepareArticleImage(await readArticleUpload(request));
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new ApiError(
        503,
        "Article image storage is not configured. Contact the website owner.",
      );
    const id = randomUUID();
    const pathname = `articles/${id}.webp`;
    try {
      await put(pathname, image, {
        access: "private",
        contentType: "image/webp",
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch {
      throw new ApiError(
        502,
        "The image could not be stored. Your article has not been changed. Please try again.",
      );
    }
    await query(
      "INSERT INTO blog_image(id,pathname,content_type,created_at) VALUES ($1,$2,'image/webp',$3)",
      [id, pathname, new Date().toISOString()],
    );
    return Response.json(
      { ok: true, image: { id, src: `/api/blog-images/${id}` } },
      { status: 201 },
    );
  } catch (error) {
    return failure(error);
  }
}
