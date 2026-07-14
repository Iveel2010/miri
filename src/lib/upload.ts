import { v2 as cloudinary } from "cloudinary";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const CONFIGURED_DRIVER = (process.env.UPLOAD_DRIVER ?? "cloudinary").toLowerCase();
const FOLDER = process.env.CLOUDINARY_FOLDER ?? "art-gallery";

function parseCloudinaryUrl(url: string): { cloudName: string; apiKey: string; apiSecret: string } | null {
  const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) return null;
  return { apiKey: m[1], apiSecret: m[2], cloudName: m[3] };
}

let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
let apiKey = process.env.CLOUDINARY_API_KEY;
let apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName && process.env.CLOUDINARY_URL) {
  const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
  if (parsed) {
    cloudName = parsed.cloudName;
    apiKey = parsed.apiKey;
    apiSecret = parsed.apiSecret;
  }
}

const DRIVER = CONFIGURED_DRIVER === "cloudinary" && !cloudName
  ? "local"
  : CONFIGURED_DRIVER;

if (DRIVER === "cloudinary") {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
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
