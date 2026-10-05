import { ApiError, requireApiUser, verifyOrigin } from "@/lib/authorization";
import { updateProject } from "@/lib/repository";
import { projectUpdateSchema } from "@/lib/validation";
import { failure, readJson, type IdContext } from "../../../_utils";

export async function PATCH(request: Request, context: IdContext) {
  try {
    verifyOrigin(request);
    await requireApiUser(request, true);
    const { id } = await context.params;
    const project = (await updateProject(
      id,
      projectUpdateSchema.parse(await readJson(request)),
    ));
    if (!project) throw new ApiError(404, "Project not found.");
    return Response.json({ ok: true, project });
  } catch (error) {
    return failure(error);
  }
}
