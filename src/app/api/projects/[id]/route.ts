import { ApiError, requireApiUser } from "@/lib/authorization";
import { getProject } from "@/lib/repository";
import { failure, type IdContext } from "../../_utils";

export async function GET(request: Request, context: IdContext) {
  try { const user = await requireApiUser(request); const { id } = await context.params; const project = getProject(id, user.id, user.role === "ADMIN"); if (!project) throw new ApiError(404, "Project not found."); return Response.json({ project }); }
  catch (error) { return failure(error); }
}
