import { ApiError, requireApiUser } from "@/lib/authorization";
import { getUserDetail } from "@/lib/repository";
import { failure, type IdContext } from "../../../_utils";

export async function GET(request: Request, context: IdContext) {
  try {
    await requireApiUser(request, true);
    const { id } = await context.params;
    const user = getUserDetail(id);
    if (!user) throw new ApiError(404, "User not found.");
    return Response.json({ user });
  } catch (error) {
    return failure(error);
  }
}
