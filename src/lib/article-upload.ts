import sharp from "sharp";
import { ApiError } from "./api-error";
export const ARTICLE_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
/** Decode and re-encode the actual raster, stripping metadata and non-image payloads. */
export async function prepareArticleImage(file: File): Promise<Buffer> {
  if (!file.size || file.size > ARTICLE_IMAGE_MAX_BYTES)
    throw new ApiError(400, "Choose an image no larger than 2 MB.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new ApiError(400, "Choose a PNG, JPEG or WebP image.");
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const image = sharp(bytes, {
      limitInputPixels: 20000000,
      failOn: "warning",
    });
    const meta = await image.metadata();
    const expected = {
      "image/png": "png",
      "image/jpeg": "jpeg",
      "image/webp": "webp",
    }[file.type];
    if (
      meta.format !== expected ||
      !meta.width ||
      !meta.height ||
      (meta.pages || 1) !== 1 ||
      meta.width > 8192 ||
      meta.height > 8192
    )
      throw Error();
    return await image
      .rotate()
      .resize({
        width: 4096,
        height: 4096,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();
  } catch {
    throw new ApiError(
      400,
      "This file is not a supported, readable image. Choose a PNG, JPEG or WebP image.",
    );
  }
}
export async function readArticleUpload(request: Request): Promise<File> {
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data"))
    throw new ApiError(415, "Send an image as multipart/form-data.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Choose an image to upload.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const result = await reader.read();
    if (result.done) break;
    size += result.value.byteLength;
    if (size > ARTICLE_IMAGE_MAX_BYTES + 65536) {
      await reader.cancel();
      throw new ApiError(413, "Choose an image no larger than 2 MB.");
    }
    chunks.push(result.value);
  }
  let form: FormData;
  try {
    form = await new Response(Buffer.concat(chunks), {
      headers: { "content-type": request.headers.get("content-type")! },
    }).formData();
  } catch {
    throw new ApiError(400, "The image upload could not be read.");
  }
  const file = form.get("file");
  if (!(file instanceof File) || form.getAll("file").length !== 1)
    throw new ApiError(400, "Choose one image to upload.");
  return file;
}
