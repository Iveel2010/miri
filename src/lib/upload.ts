import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const CONFIGURED_DRIVER = (process.env.UPLOAD_DRIVER ?? "cloudinary").toLowerCase();
const FOLDER = process.env.CLOUDINARY_FOLDER ?? "art-gallery";

/**
 * Effective driver. When `cloudinary` is selected but its credentials are
 * missing, fall back to local disk storage so the app still works without
 * external configuration (e.g. local development).
 */
const DRIVER = CONFIGURED_DRIVER === "cloudinary" && !process.env.CLOUDINARY_CLOUD_NAME
  ? "local"
  : CONFIGURED_DRIVER;

if (DRIVER === "cloudinary") {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  url: string;
  publicId: string;
}

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

function extractPublicId(url: string): string {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  return m ? m[1] : url;
}

export async function uploadImage(
  input: Buffer | string,
  opts: { folder?: string; transformation?: Record<string, unknown> } = {},
): Promise<UploadResult> {
  const folder = opts.folder ?? FOLDER;

  if (DRIVER === "local") {
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    const ext = typeof input === "string" ? input.match(/data:image\/([a-zA-Z0-9]+)/)?.[1] ?? "jpg" : "bin";
    const filename = `${randomUUID()}.${ext}`;
    const filePath = path.join(dir, filename);
    const buf = Buffer.isBuffer(input)
      ? input
      : Buffer.from(input.replace(/^data:.*;base64,/, ""), "base64");
    await writeFile(filePath, buf);
    const url = `/uploads/${folder}/${filename}`;
    return { url, publicId: url };
  }

  if (DRIVER === "cloudinary") {
    // Cloudinary's SDK treats non-URL strings as local file paths. Its
    // `isRemoteUrl` check only accepts base64 payloads made of
    // [A-Za-z0-9/+=], so a malformed/huge data URI slips through and the SDK
    // ends up calling fs.open() on the whole string -> ENAMETOOLONG (500).
    // Always decode to a Buffer and re-wrap as a clean data URI so the SDK
    // uploads it as a remote base64 payload.
    const buffer = Buffer.isBuffer(input)
      ? input
      : Buffer.from(input.replace(/^data:.*;base64,/, ""), "base64");
    const resource = `data:image/*;base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(resource, {
      folder,
      overwrite: false,
      resource_type: "image",
      transformation: opts.transformation ?? { quality: "auto", fetch_format: "auto" },
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  throw new Error(`Unsupported UPLOAD_DRIVER: ${DRIVER}`);
}

export async function uploadMany(
  inputs: Array<Buffer | string>,
  opts: { folder?: string } = {},
): Promise<UploadResult[]> {
  return Promise.all(inputs.map((i) => uploadImage(i, opts)));
}

export async function deleteImage(publicIdOrUrl: string): Promise<void> {
  if (!publicIdOrUrl) return;
  if (DRIVER === "local") {
    const full = publicIdOrUrl.startsWith("/")
      ? path.join(process.cwd(), "public", publicIdOrUrl)
      : publicIdOrUrl;
    await unlink(full).catch(() => undefined);
    return;
  }
  if (!isCloudinaryUrl(publicIdOrUrl)) return;
  await cloudinary.uploader
    .destroy(extractPublicId(publicIdOrUrl))
    .catch(() => undefined);
}
