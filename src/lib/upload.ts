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

const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;

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
  opts: { folder?: string; transformation?: Record<string, unknown>; type?: string } = {},
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
    const buffer = Buffer.isBuffer(input)
      ? input
      : Buffer.from(input.replace(/^data:.*;base64,/, ""), "base64");
    const mimeType = opts.type || "image/png";
    const base64 = buffer.toString("base64");
    const dataUri = `data:${mimeType};base64,${base64}`;

    const form = new FormData();
    form.append("file", dataUri);
    form.append("upload_preset", UPLOAD_PRESET || "miri.mn");
    form.append("folder", folder);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: form as unknown as BodyInit,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Cloudinary upload failed (${res.status}): ${text}`);
    }

    const result = (await res.json()) as {
      secure_url: string;
      public_id: string;
    };

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

  const publicId = extractPublicId(publicIdOrUrl);
  if (!publicId) return;

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("upload_preset", UPLOAD_PRESET || "miri.mn");

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form as unknown as BodyInit,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary delete failed (${res.status}): ${text}`);
  }
}
