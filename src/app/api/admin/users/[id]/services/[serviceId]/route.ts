import { ApiError, requireApiUser, verifyOrigin } from "@/lib/authorization";
import { getClientService, updateServiceAssignment } from "@/lib/repository";
import { serviceAssignmentUpdateSchema } from "@/lib/validation";
import { failure, readJson } from "../../../../../_utils";

export async function PATCH(request: Request, context: { params: Promise<{ id: string; serviceId: string }> }) {
  try {
    verifyOrigin(request);
    await requireApiUser(request, true);
    const { id, serviceId } = await context.params;
    const existing = getClientService(serviceId, id);
    if (!existing) throw new ApiError(404, "Assigned service not found.");
    const input = serviceAssignmentUpdateSchema.parse(await readJson(request));
    if ((input.endDate || existing.endDate) < (input.startDate || existing.startDate)) throw new ApiError(400, "The end date must follow the start date.");
    return Response.json({ ok: true, service: updateServiceAssignment(serviceId, id, input) });
  } catch (error) { return failure(error); }
}
