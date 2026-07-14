import Image from "next/image";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/Button";
import { formatPrice } from "@/lib/format";
import type { Artwork } from "@/types/artwork";

interface Props {
  items: Artwork[];
}

export default function ShopFeatured({ items }: Props) {
  const featured = items.filter((art) => art.featured);

  return (
    <section className="bg-shop px-6 py-24 md:py-32" id="collection">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-shop-soft">
            Featured Collection
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-shop-ink sm:text-5xl">
            The pieces collectors ask for first.
          </h2>
          <p className="mt-4 text-shop-soft">
            A short, considered selection of limited works — each numbered,
            signed, and made to be kept.
          </p>
        </Reveal>

        <div className="mt-16 space-y-20 md:space-y-28">
          {featured.map((art, i) => {
            const flip = i % 2 === 1;
            return (
              <Reveal key={art.id} delay={i * 60}>
                <article
                  className={`group grid items-center gap-8 md:grid-cols-2 md:gap-14 ${
                    flip ? "md:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div className="relative overflow-hidden rounded-[2rem] bg-shop-beige shadow-sm">
                    <div className="relative aspect-[4/5]">
                      <Image
                        src={art.image}
                        alt={`${art.title} — ${art.artist}`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold tracking-wide text-shop-ink backdrop-blur">
                        Limited Edition
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-shop-soft">
                      {art.artist}
                    </p>
                    <h3 className="mt-2 font-display text-3xl font-semibold text-shop-ink sm:text-4xl">
                      {art.title}
                    </h3>
                    <p className="mt-3 text-shop-soft">
                      {art.medium} · {art.year}
                    </p>
                    <p className="mt-1 text-sm text-shop-soft">{art.edition}</p>

                    <div className="mt-8 flex items-center gap-6">
                      <span className="font-display text-2xl font-semibold text-shop-ink">
                        {formatPrice(art.price ?? 0)}
                      </span>
                      <Button href={`/artwork/${art.id}`} variant="secondary">
                        Add to Collection ✦
                      </Button>
                    </div>

                    <div className="mt-6 max-h-0 overflow-hidden opacity-0 transition-all duration-700 ease-out group-hover:max-h-24 group-hover:opacity-100">
                      <p className="border-l-2 border-shop-blush pl-4 text-sm italic text-shop-soft">
                        Numbered and signed by the artist. Includes a
                        certificate of authenticity and complimentary
                        white-glove delivery.
                      </p>
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
