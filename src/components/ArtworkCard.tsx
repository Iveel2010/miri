import Image from "next/image";
import Link from "next/link";
import { Badge } from "./Badge";
import type { Artwork } from "@/types/artwork";

const SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

interface ArtworkCardProps {
  artwork: Artwork;
  showArtist?: boolean;
  subtitle?: string;
  imageClassName?: string;
  full?: boolean;
}

export function ArtworkCard({
  artwork,
  showArtist = true,
  subtitle,
  imageClassName = "h-60",
  full = false,
}: ArtworkCardProps) {
  if (full) {
    return (
      <article className="group relative overflow-hidden shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-accent/10">
        <Link
          href={`/artwork/${artwork.id}`}
          className={`relative block overflow-hidden ${imageClassName}`}
          aria-label={`${artwork.title} — ${artwork.artist}-ийн`}
        >
          <Image
            src={artwork.image}
            alt={`${artwork.title} — ${artwork.artist}-ийн`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-5 text-white opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <h3 className="font-display text-xl font-semibold">
              {artwork.title}
            </h3>
            <p className="mt-1 text-sm text-white/80">
              {artwork.artist}-ийн
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-white/60">
              {subtitle ?? `${artwork.medium} · ${artwork.year}`}
            </p>
          </div>
          <Badge className="absolute left-3 top-3 bg-white/85 text-primary backdrop-blur">
            {artwork.category}
          </Badge>
        </Link>
      </article>
    );
  }

  return (
      <article className="group relative h-full overflow-hidden border border-border bg-card p-3 shadow-sm transition-all duration-500 hover:border-accent/25 hover:shadow-lg hover:shadow-accent/10">
      <Link
        href={`/artwork/${artwork.id}`}
        className={`relative block overflow-hidden ${imageClassName}`}
        aria-label={`${artwork.title} — ${artwork.artist}-ийн`}
      >
        <Image
          src={artwork.image}
          alt={`${artwork.title} — ${artwork.artist}-ийн`}
          fill
          sizes={SIZES}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <Badge className="absolute left-3 top-3 bg-white/85 text-primary backdrop-blur transition-opacity duration-500 group-hover:opacity-0">
          {artwork.category}
        </Badge>
      </Link>
      <div className="px-3 py-4">
        <h3 className="font-display text-xl font-semibold text-primary transition-colors duration-500 group-hover:text-accent">
          {artwork.title}
        </h3>
        <p className="mt-1 text-sm text-primary/60">
          {subtitle ?? (showArtist ? `${artwork.artist}-ийн` : "")}
        </p>
      </div>
    </article>
  );
}
