import { requireApiUser, verifyOrigin } from "@/lib/authorization";
import { createBlogPost, listBlogPosts } from "@/lib/repository";
import { blogSchema } from "@/lib/validation";
import { failure, readJson } from "../../_utils";

export async function GET(request: Request) {
  try {
    await requireApiUser(request, true);
    return Response.json({ posts: await listBlogPosts() });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    await requireApiUser(request, true);
    const post = await createBlogPost(
      blogSchema.parse(await readJson(request)),
    );
    return Response.json({ ok: true, post }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "23505")
      return Response.json(
        { error: "An article with this slug already exists in this language." },
        { status: 409 },
      );
    return failure(error);
  }
}
