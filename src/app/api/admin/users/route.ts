import { requireApiUser } from "@/lib/authorization";
import { listUsers } from "@/lib/repository";
import { failure } from "../../_utils";

export async function GET(request: Request) {
  try {
    await requireApiUser(request, true);
    const query = new URL(request.url).searchParams;
    return Response.json(
      (await listUsers({
        search: query.get("search") || undefined,
        role: query.get("role") || undefined,
        page: Number(query.get("page")) || 1,
      })),
    );
  } catch (error) {
    return failure(error);
  }
}
