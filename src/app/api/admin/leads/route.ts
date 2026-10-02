import { requireApiUser } from "@/lib/authorization";
import { listLeads } from "@/lib/repository";
import { failure } from "../../_utils";

export async function GET(request: Request) {
  try { await requireApiUser(request, true); const url = new URL(request.url); return Response.json({ leads: listLeads({ status: url.searchParams.get("status") || undefined, search: url.searchParams.get("search") || undefined }) }); }
  catch (error) { return failure(error); }
}
