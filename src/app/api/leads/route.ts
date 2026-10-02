import { ApiError, verifyOrigin } from "@/lib/authorization";
import { consumeRateLimit, createLead } from "@/lib/repository";
import { leadSchema } from "@/lib/validation";
import { failure, readJson } from "../_utils";

export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const input = leadSchema.parse(await readJson(request));
    // Trust proxy-derived addresses only behind a proxy configured by the operator.
    const ip = process.env.TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown" : "local";
    if (!consumeRateLimit(`lead-contact:${input.email.toLowerCase() || input.phone}`, 5) || !consumeRateLimit(`lead-ip:${ip}`, 30)) throw new ApiError(429, "Too many requests. Please try again later.");
    const lead = createLead(input);
    return Response.json({ ok: true, id: lead.id }, { status: 201 });
  } catch (error) { return failure(error); }
}
