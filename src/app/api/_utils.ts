import { ZodError } from "zod";
import { ApiError } from "@/lib/authorization";

export async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new ApiError(415, "Send application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A JSON body is required.");
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const result = await reader.read(); if (result.done) break;
    size += result.value.byteLength;
    if (size > 300000) { await reader.cancel(); throw new ApiError(413, "Request body is too large."); }
    chunks.push(result.value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "Invalid JSON body."); }
}

export function failure(error: unknown): Response {
  if (error instanceof ApiError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof ZodError) return Response.json({ error: "Please check the submitted fields.", issues: error.flatten() }, { status: 400 });
  if (error instanceof Error && "code" in error && String(error.code).startsWith("SQLITE_CONSTRAINT")) return Response.json({ error: "This change conflicts with existing records. Check the slug or selected client." }, { status: 409 });
  console.error("Salsal API operation failed", error instanceof Error ? error.name : "UnknownError");
  return Response.json({ error: "Unable to complete this request. Please try again." }, { status: 500 });
}

export type IdContext = { params: Promise<{ id: string }> };
