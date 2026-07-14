"use client";

import { useMemo, useState, useCallback } from "react";
import { ArtworkCard } from "@/components/ArtworkCard";
import { apiList } from "@/lib/api-client";
import { toArtworks } from "@/lib/mappers";
import type { Artwork } from "@/types/artwork";
import type { ApiArtwork, PaginationMeta } from "@/types/api";

const ALL = "Бүгд";
const PAGE_SIZE = 12;

const MASONRY_ASPECTS = [
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[4/3]",
  "aspect-[5/4]",
  "aspect-[3/4]",
];

type SortKey = "newest" | "price_asc" | "price_desc" | "popular";
const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Шинэ нь" },
  { key: "price_asc", label: "Үнэ өсөх" },
  { key: "price_desc", label: "Үнэ буурах" },
  { key: "popular", label: "Түгээмэл" },
];

interface Props {
  initialArtworks: Artwork[];
  initialMeta: PaginationMeta;
  categories: { name: string; id: string }[];
}

export function GalleryExplorer({
  initialArtworks,
  initialMeta,
  categories,
}: Props) {
  const [active, setActive] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
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
        if (query.trim()) params.set("q", query.trim());
        if (active !== ALL) {
          const id = catMap.get(active);
          if (id) params.set("category", id);
        }
        params.set("sort", sort);
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

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
    [query, active, sort, catMap],
  );

  const onFilterChange = (mutate: () => void) => {
    mutate();
    setArtworks([]);
    void fetchPage(1, true);
  };

  const loadMore = () => {
    if (!meta.hasNext) return;
    void fetchPage(meta.page + 1, false);
  };

  return (
    <section className="px-6 pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-7xl">
        <header className="relative text-center">
          <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-xl text-accent shadow-sm">
            ✦
          </span>
          <h1 className="mt-3 font-display text-5xl font-bold text-primary sm:text-6xl">
            Gallery
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-primary/60">
            Зөөлөн, мөрөөдлийн жаахан ертөнцүүд — будгаар болон дижиталээр
            бүтээгдсэн.
          </p>
        </header>

        <div className="mt-12 flex flex-col gap-10 lg:flex-row lg:gap-12">
          <aside className="lg:w-60 lg:shrink-0">
            <div className="lg:sticky lg:top-28">
              <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary/40">
                Ангилал
              </p>
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
                <button
                  type="button"
                  onClick={() => onFilterChange(() => setActive(ALL))}
                  className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-300 lg:w-full ${
                    active === ALL
                      ? "bg-gradient-to-r from-accent to-accent-secondary text-white shadow-md shadow-accent/20"
                      : "text-primary/70 hover:bg-accent/10 hover:text-accent"
                  }`}
                >
                  <span className="text-base leading-none">✦</span>
                  {ALL}
                </button>
                {categories.map((cat) => {
                  const isActive = cat.name === active;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onFilterChange(() => setActive(cat.name))}
                      className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-300 lg:w-full ${
                        isActive
                          ? "bg-gradient-to-r from-accent to-accent-secondary text-white shadow-md shadow-accent/20"
                          : "text-primary/70 hover:bg-accent/10 hover:text-accent"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium tracking-wide text-primary/45">
                {loading ? "Ачаалж байна…" : `${meta.total} бүтээл`}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="search"
                  value={query}
                  onChange={(e) =>
                    onFilterChange(() => setQuery(e.target.value))
                  }
                  placeholder="Хайх: нэр, уран зураач…"
                  aria-label="Бүтээл хайх"
                  className="w-full rounded-full border border-border bg-card py-2.5 pl-4 pr-4 text-sm text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent sm:w-64"
                />
                <select
                  value={sort}
                  onChange={(e) =>
                    onFilterChange(() => setSort(e.target.value as SortKey))
                  }
                  aria-label="Эрэмбэлэх"
                  className="rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-primary/80 outline-none transition-colors focus:border-accent"
                >
                  {SORTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {artworks.length === 0 && !loading ? (
              <div className="mt-20 text-center text-primary/50">
                <p className="text-2xl">🌿</p>
                <p className="mt-3">
                  Энэ ангилалд эсвэл хайлтад тохирох бүтээл байхгүй байна.
                </p>
              </div>
            ) : (
              <div className="mt-8 columns-1 gap-5 sm:columns-2 xl:columns-3 [column-fill:_balance]">
                {artworks.map((art, i) => (
                  <div
                    key={art.id}
                    className="mb-5 break-inside-avoid animate-fade-in-up"
                    style={{ animationDelay: `${(i % 12) * 60}ms` }}
                  >
                    <ArtworkCard
                      artwork={art}
                      showArtist={false}
                      subtitle={`${art.medium ?? ""} · ${art.year ?? ""}`}
                      imageClassName={
                        MASONRY_ASPECTS[i % MASONRY_ASPECTS.length]
                      }
                      full
                    />
                  </div>
                ))}
              </div>
            )}

            {meta.hasNext && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-full border border-accent/40 px-7 py-3 text-sm font-medium text-accent transition-all duration-300 hover:bg-accent/10 disabled:opacity-50"
                >
                  Дэлгэрэнгүй
                  <span className="text-xs text-primary/40">
                    ({meta.total - artworks.length})
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
