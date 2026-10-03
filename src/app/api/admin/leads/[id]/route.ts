import { ApiError, requireApiUser, verifyOrigin } from "@/lib/authorization";
import { updateLead } from "@/lib/repository";
import { leadUpdateSchema } from "@/lib/validation";
import { failure, readJson, type IdContext } from "../../../_utils";

export async function PATCH(request: Request, context: IdContext) {
  try {
    verifyOrigin(request);
    await requireApiUser(request, true);
    const { id } = await context.params;
    const input = leadUpdateSchema.parse(await readJson(request));
    if (!updateLead(id, input.status, input.notes))
      throw new ApiError(404, "Lead not found.");
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
