import { ApiError, requireApiUser, verifyOrigin } from "@/lib/authorization";
import { updateServiceSetting } from "@/lib/repository";
import { serviceIds, serviceSettingSchema } from "@/lib/validation";
import { failure, readJson, type IdContext } from "../../../_utils";

export async function PATCH(request: Request, context: IdContext) {
  try {
    verifyOrigin(request);
    await requireApiUser(request, true);
    const { id } = await context.params;
    if (!(serviceIds as readonly string[]).includes(id))
      throw new ApiError(404, "Service not found.");
    updateServiceSetting(
      id,
      serviceSettingSchema.parse(await readJson(request)),
    );
    return Response.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
