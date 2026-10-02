import { ApiError, requireApiUser, verifyOrigin } from "@/lib/authorization";
import { deleteBlogPost, updateBlogPost } from "@/lib/repository";
import { blogUpdateSchema } from "@/lib/validation";
import { failure, readJson, type IdContext } from "../../../_utils";

export async function PATCH(request: Request, context: IdContext) {
  try { verifyOrigin(request); await requireApiUser(request, true); const { id } = await context.params; const post = updateBlogPost(id, blogUpdateSchema.parse(await readJson(request))); if (!post) throw new ApiError(404, "Article not found."); return Response.json({ ok: true, post }); }
  catch (error) { return failure(error); }
}
export async function DELETE(request: Request, context: IdContext) {
  try { verifyOrigin(request); await requireApiUser(request, true); const { id } = await context.params; if (!deleteBlogPost(id)) throw new ApiError(404, "Article not found."); return Response.json({ ok: true }); }
  catch (error) { return failure(error); }
}
