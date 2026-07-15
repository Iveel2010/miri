"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

type SafeImageProps = ImageProps & { fallbackSrc?: string };

/**
 * next/image wrapper that swaps to `fallbackSrc` if the primary source fails
 * to load (e.g. a deleted Cloudinary asset). Prevents a broken-image icon
 * when a stored URL is dead.
 */
export default function SafeImage({
  src,
  fallbackSrc,
  alt,
  ...rest
}: SafeImageProps) {
  const [errored, setErrored] = useState(false);
  const resolved = errored && fallbackSrc ? fallbackSrc : src;
  return (
    <Image
      {...rest}
      src={resolved}
      alt={alt}
      onError={() => setErrored(true)}
    />
  );
}
