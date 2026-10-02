import { requireApiUser, verifyOrigin } from "@/lib/authorization";
import { createPortfolio } from "@/lib/repository";
import { portfolioSchema } from "@/lib/validation";
import { failure, readJson } from "../../_utils";

export async function POST(request: Request) {
  try { verifyOrigin(request); await requireApiUser(request, true); const project = createPortfolio(portfolioSchema.parse(await readJson(request))); return Response.json({ ok: true, project }, { status: 201 }); }
  catch (error) { return failure(error); }
}
