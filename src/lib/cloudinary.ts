const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

export function extractPublicId(url: string): string | null {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  return m ? m[1] : null;
}

export function buildCloudinaryUrl(
  publicId: string,
  opts: { width?: number; height?: number; quality?: string | number; format?: string; crop?: string } = {}
): string {
  const transforms: string[] = [];

  if (opts.crop && opts.width) {
    transforms.push(`c_${opts.crop}`);
    transforms.push(`w_${opts.width}`);
  }
  if (opts.height) transforms.push(`h_${opts.height}`);
  if (opts.quality) transforms.push(`q_${opts.quality}`);
  if (opts.format) transforms.push(`f_${opts.format}`);

  transforms.push("q_auto", "f_auto");

  const transform = transforms.join(",");
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${publicId}`;
}

export function optimizeCloudinaryUrl(url: string): string {
  if (!isCloudinaryUrl(url) || !CLOUD_NAME) return url;

  const publicId = extractPublicId(url);
  if (!publicId) return url;

  if (url.includes("/c_") || url.includes("/q_auto")) return url;

  return buildCloudinaryUrl(publicId);
}
