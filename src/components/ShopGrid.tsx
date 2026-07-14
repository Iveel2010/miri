"use client";

import { useMemo, useState, useCallback } from "react";
import { ArtworkCard } from "@/components/ArtworkCard";
import { apiList } from "@/lib/api-client";
import { toArtworks } from "@/lib/mappers";
import type { Artwork } from "@/types/artwork";
import type { ApiArtwork, PaginationMeta } from "@/types/api";

const ALL = "Бүгд";

interface Props {
  initialArtworks: Artwork[];
  initialMeta: PaginationMeta;
  categories: { name: string; id: string }[];
}

export function ShopGrid({ initialArtworks, initialMeta, categories }: Props) {
  const [active, setActive] = useState<string>(ALL);
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [meta, setMeta] = useState<PaginationMeta>(initialMeta);
  const [loading, setLoading] = useState(false);

  const catMap = useMemo(
    () => new Map(categories.map((c) => [c.name, c.id])),
    [categories],
  );

  const fetchPage = useCallback(
    async (page: number, replace: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (active !== ALL) {
          const id = catMap.get(active);
          if (id) params.set("category", id);
        }
        params.set("page", String(page));
        params.set("limit", String(12));
        const { items, meta: m } = await apiList<ApiArtwork>(
          `/api/artworks?${params.toString()}`,
        );
        const mapped = toArtworks(items);
        setArtworks((prev) => (replace ? mapped : [...prev, ...mapped]));
        setMeta(m);
      } finally {
        setLoading(false);
      }
    },
    [active, catMap],
  );

  const onCategory = (name: string) => {
    setActive(name);
    setArtworks([]);
    void fetchPage(1, true);
  };

  return (
    <section id="collection" className="px-6 pb-24">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            Дэлгүүр
          </p>
          <h2 className="mt-3 font-display text-4xl font-bold text-shop-ink">
            Бүтээлүүд
          </h2>
        </header>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => onCategory(ALL)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
              active === ALL
                ? "bg-shop-ink text-white"
                : "bg-white/70 text-shop-ink hover:bg-white"
            }`}
          >
            {ALL}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategory(cat.name)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                active === cat.name
                  ? "bg-shop-ink text-white"
                  : "bg-white/70 text-shop-ink hover:bg-white"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading && artworks.length === 0 ? (
          <p className="text-center text-shop-soft">Ачаалж байна…</p>
        ) : artworks.length === 0 ? (
          <p className="text-center text-shop-soft">Бүтээл олдсонгүй.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {artworks.map((art) => (
              <ArtworkCard key={art.id} artwork={art} />
            ))}
          </div>
        )}

        {meta.hasNext && (
          <div className="mt-12 text-center">
            <button
              type="button"
              onClick={() => fetchPage(meta.page + 1, false)}
              disabled={loading}
              className="rounded-full bg-shop-ink px-7 py-3 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
            >
              Дэлгэрэнгүй
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
