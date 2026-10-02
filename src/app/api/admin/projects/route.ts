import { requireApiUser, verifyOrigin } from "@/lib/authorization";
import { createProject, listProjects } from "@/lib/repository";
import { projectSchema } from "@/lib/validation";
import { failure, readJson } from "../../_utils";

export async function GET(request: Request) {
  try { await requireApiUser(request, true); return Response.json({ projects: listProjects() }); } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try { verifyOrigin(request); await requireApiUser(request, true); const input = projectSchema.parse(await readJson(request)); const project = createProject(input); return Response.json({ ok: true, project }, { status: 201 }); }
  catch (error) { return failure(error); }
}
