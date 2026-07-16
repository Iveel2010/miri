export function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com");
}

export function extractPublicId(url: string): string | null {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
  return m ? m[1] : null;
}

export function extractCloudName(url: string): string | null {
  const m = url.match(/res\.cloudinary\.com\/([^/]+)\//);
  return m ? m[1] : null;
}

export function buildCloudinaryUrl(
  publicId: string,
  cloudName: string,
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
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

export function optimizeCloudinaryUrl(url: string): string {
  if (!isCloudinaryUrl(url)) return url;

  const publicId = extractPublicId(url);
  if (!publicId) return url;

  if (url.includes("/c_") || url.includes("/q_auto")) return url;

  const cloudName = extractCloudName(url) ?? process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return url;

  return buildCloudinaryUrl(publicId, cloudName);
}
