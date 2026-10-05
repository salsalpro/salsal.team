import { ApiError, requireApiUser, verifyOrigin } from "@/lib/authorization";
import { createDeliverable, getProject } from "@/lib/repository";
import { deliverableSchema } from "@/lib/validation";
import { failure, readJson, type IdContext } from "../../../../_utils";

export async function POST(request: Request, context: IdContext) {
  try {
    verifyOrigin(request);
    await requireApiUser(request, true);
    const { id } = await context.params;
    if (!(await getProject(id, undefined, true)))
      throw new ApiError(404, "Project not found.");
    const input = deliverableSchema.parse(await readJson(request));
    const deliverableId = (await createDeliverable(id, input));
    return Response.json({ ok: true, id: deliverableId }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
