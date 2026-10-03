import { requireApiUser, verifyOrigin } from "@/lib/authorization";
import { getProfile, updateProfile } from "@/lib/repository";
import { profileSchema } from "@/lib/validation";
import { failure, readJson } from "../_utils";

export async function GET(request: Request) {
  try {
    const user = await requireApiUser(request);
    return Response.json({ profile: getProfile(user.id) });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    verifyOrigin(request);
    const user = await requireApiUser(request);
    const profile = updateProfile(
      user.id,
      profileSchema.parse(await readJson(request)),
    );
    return Response.json({ ok: true, profile });
  } catch (error) {
    return failure(error);
  }
}
