import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";

export interface ShopCollection {
  id: string;
  name: string;
  tagline: string;
  image: string;
  accent: string;
}

export default function ShopCurated({
  collections,
}: {
  collections: ShopCollection[];
}) {
  if (collections.length === 0) return null;
  return (
    <section className="bg-shop px-6 py-24 md:py-32">
      <div className="mx-auto max-w-6xl">
        <Reveal className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-shop-soft">
            Curated Collections
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-shop-ink sm:text-5xl">
            Choose a feeling, not a category.
          </h2>
          <p className="mt-4 text-shop-soft">
            Small worlds, each gathered from the storefront. Step into one and let it
            find you.
          </p>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
          {collections.map((col, i) => (
            <Reveal key={col.id} delay={(i % 4) * 80}>
              <Link
                href={`/collection/${col.id}`}
                className="group relative block overflow-hidden rounded-[1.75rem]"
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src={col.image}
                    alt={col.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-500 group-hover:opacity-90"
                    style={{
                      background: `linear-gradient(180deg, ${col.accent}00 35%, ${col.accent}cc 100%)`,
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-shop-ink/70">
                      {col.tagline}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-shop-ink">
                      {col.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
