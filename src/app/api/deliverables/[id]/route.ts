import { ApiError, requireApiUser } from "@/lib/authorization";
import { getAuthorizedDeliverable } from "@/lib/repository";
import { failure, type IdContext } from "../../_utils";

export async function GET(request: Request, context: IdContext) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const deliverable = getAuthorizedDeliverable(
      id,
      user.id,
      user.role === "ADMIN",
    );
    if (!deliverable) throw new ApiError(404, "File not found.");
    return new Response(deliverable.content, {
      headers: {
        "Content-Type": `${deliverable.mimeType}; charset=utf-8`,
        "Content-Disposition": `attachment; filename="${deliverable.filename.replace(/[^a-zA-Z0-9_.-]/g, "_")}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return failure(error);
  }
}
