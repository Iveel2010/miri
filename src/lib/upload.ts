import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const CONFIGURED_DRIVER = (process.env.UPLOAD_DRIVER ?? "cloudinary").toLowerCase();
const FOLDER = process.env.CLOUDINARY_FOLDER ?? "art-gallery";

let cloudName = process.env.CLOUDINARY_CLOUD_NAME;

if (!cloudName && process.env.CLOUDINARY_URL) {
  const m = process.env.CLOUDINARY_URL.match(/^cloudinary:\/\/(?:[^:]+:[^@]+@)(.+)$/);
  if (m) cloudName = m[1];
}

const DRIVER = CONFIGURED_DRIVER === "cloudinary" && !cloudName
  ? "local"
  : CONFIGURED_DRIVER;

const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || "miri.mn";

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

function toDataUri(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function dataUriToBlob(dataUri: string, fallbackMimeType: string = "image/png"): Blob {
  let header: string;
  let base64: string;

  if (dataUri.startsWith("data:")) {
    const parts = dataUri.split(",");
    header = parts[0];
    base64 = parts[1] || "";
  } else {
    header = `data:${fallbackMimeType}`;
    base64 = dataUri;
  }

  const mimeMatch = header.match(/data:([^;]+)/);
  const mimeType = mimeMatch?.[1] || "image/png";
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return new Blob([binary.buffer], { type: mimeType });
}

export async function uploadImage(
  input: Buffer | string,
  opts: { folder?: string; transformation?: Record<string, unknown>; type?: string } = {},
): Promise<UploadResult> {
  const folder = opts.folder ?? FOLDER;

  if (DRIVER === "local") {
    const dir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(dir, { recursive: true });
    const ext = typeof input === "string"
      ? input.match(/data:image\/([a-zA-Z0-9]+)/)?.[1] ?? "jpg"
      : "bin";
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
    const mimeType = opts.type || "image/png";
    const dataUri = Buffer.isBuffer(input)
      ? toDataUri(input, mimeType)
      : input;

    const blob = dataUriToBlob(dataUri, mimeType);
    const ext = mimeType.split("/")[1] || "png";
    const filename = `${randomUUID()}.${ext}`;

    const form = new FormData();
    form.append("file", blob, filename);
    form.append("upload_preset", UPLOAD_PRESET);
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
  form.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: "POST",
    body: form as unknown as BodyInit,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary delete failed (${res.status}): ${text}`);
  }
}
