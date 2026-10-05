import { ApiError, requireApiUser } from "@/lib/authorization";
import { getProject } from "@/lib/repository";
import { failure, type IdContext } from "../../_utils";

export async function GET(request: Request, context: IdContext) {
  try {
    const user = await requireApiUser(request);
    const { id } = await context.params;
    const project = (await getProject(id, user.id, user.role === "ADMIN"));
    if (!project) throw new ApiError(404, "Project not found.");
    // Staff notes are private even when the customer owns the project.
    return Response.json({
      project: user.role === "ADMIN" ? project : { ...project, notes: "" },
    });
  } catch (error) {
    return failure(error);
  }
}
