import Image from "next/image";
import Reveal from "@/components/Reveal";

export interface ShopArtistWork {
  id: string;
  title: string;
  year: string;
  image: string;
}

export interface ShopArtistProfile {
  name: string;
  location: string | null;
  portrait: string | null;
  bio: string | null;
}

export default function ShopArtist({
  artist,
  works,
}: {
  artist: ShopArtistProfile;
  works: ShopArtistWork[];
}) {
  return (
    <section className="bg-shop px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-shop-soft">
            Featured Artist
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-shop-ink sm:text-5xl">
            In focus: {artist.name}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-12 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
          <Reveal>
            <div className="relative">
              <div className="overflow-hidden rounded-[2rem] bg-shop-beige shadow-sm">
                <div className="relative aspect-[4/5]">
                  {artist.portrait ? (
                    <Image
                      src={artist.portrait}
                      alt={artist.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-shop-ink/5 font-display text-6xl text-shop-ink/30">
                      {artist.name.charAt(0)}
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm text-shop-soft">
                {artist.location ?? "—"}
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <p className="text-lg leading-relaxed text-shop-ink/80">
              {artist.bio ?? ""}
            </p>

            <div className="mt-10">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-shop-soft">
                Selected works
              </p>
              <div className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {works.map((w) => (
                  <div
                    key={w.id}
                    className="w-44 shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-sm"
                  >
                    <div className="relative aspect-[3/4]">
                      <Image
                        src={w.image}
                        alt={w.title}
                        fill
                        sizes="176px"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <p className="font-display text-sm font-semibold text-shop-ink">
                        {w.title}
                      </p>
                      <p className="text-xs text-shop-soft">{w.year}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
