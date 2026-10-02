import { ApiError, requireApiUser, verifyOrigin } from "@/lib/authorization";
import { createServiceAssignment, getProfile } from "@/lib/repository";
import { serviceAssignmentSchema } from "@/lib/validation";
import { failure, readJson, type IdContext } from "../../../../_utils";

export async function POST(request: Request, context: IdContext) {
  try {
    verifyOrigin(request);
    await requireApiUser(request, true);
    const { id } = await context.params;
    if (!getProfile(id)) throw new ApiError(404, "User not found.");
    const input = serviceAssignmentSchema.parse(await readJson(request));
    if (input.endDate < input.startDate) throw new ApiError(400, "The end date must follow the start date.");
    return Response.json({ ok: true, service: createServiceAssignment(id, input) }, { status: 201 });
  } catch (error) { return failure(error); }
}
