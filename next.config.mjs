/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Artwork/logo images are pasted from arbitrary external sources (Google,
    // Facebook, etc.), so hostname whitelisting is impractical. Disable
    // Next's image optimizer to allow any URL without configuring remotePatterns.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
