import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { serverApi, serverApiList } from "@/lib/server-api";
import { toArtwork, toArtworks } from "@/lib/mappers";
import { ArtworkCard } from "@/components/ArtworkCard";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import PurchaseRequestTrigger from "@/components/PurchaseRequestTrigger";
import Reveal from "@/components/Reveal";
import Lightbox from "@/components/Lightbox";
import ShareButtons from "@/components/ShareButtons";
import { formatPrice } from "@/lib/format";
import type { ApiArtwork } from "@/types/api";

interface ArtworkPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

async function loadArtwork(id: string): Promise<ApiArtwork | null> {
  try {
    // getByIdOrSlug increments the view count server-side.
    return await serverApi<ApiArtwork>(`/api/artworks/${id}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: ArtworkPageProps): Promise<Metadata> {
  const { id } = await params;
  const art = await loadArtwork(id);
  if (!art) return { title: "Бүтээл олдсонгүй — Miry" };
  return {
    title: `${art.title} — ${art.artist.name} | Miry`,
    description:
      art.description ?? `${art.title} — ${art.artist.name}-ийн бүтээл.`,
    openGraph: {
      title: `${art.title} — ${art.artist.name}`,
      description:
        art.description ?? `${art.title} — ${art.artist.name}-ийн бүтээл.`,
      images: [art.image],
    },
  };
}

export default async function ArtworkPage({ params }: ArtworkPageProps) {
  const { id } = await params;
  const api = await loadArtwork(id);
  if (!api) notFound();

  const art = toArtwork(api);

  const relatedApi = await serverApiList<ApiArtwork>(
    `/api/artworks?category=${api.category?.id ?? ""}&limit=4`,
  ).catch(() => ({ items: [] as ApiArtwork[], meta: {} }));
  const related = toArtworks(relatedApi.items)
    .filter((r) => r.id !== art.id)
    .slice(0, 3);

  const META_ROWS = [
    { key: "Урлаг", get: (a: typeof art) => a.category },
    { key: "Техник", get: (a: typeof art) => a.medium ?? "—" },
    { key: "Хэмжээ", get: (a: typeof art) => a.dimensions ?? "—" },
    { key: "Байдал", get: (a: typeof art) => a.availability ?? "—" },
    { key: "Он", get: (a: typeof art) => a.year ?? "—" },
    { key: "Уран зураач", get: (a: typeof art) => a.artist },
  ];

  return (
    <section className="px-6 pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-10">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary/60 transition-colors hover:text-accent"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Урлас руу буцах
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <div className="relative overflow-hidden border border-border bg-card shadow-lg shadow-accent/5">
              <Lightbox artwork={art} related={related} />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex items-center gap-3">
              <Badge>{art.category}</Badge>
              {art.year && (
                <span className="text-xs font-semibold uppercase tracking-wider text-primary/40">
                  {art.year}
                </span>
              )}
            </div>

            <h1 className="mt-5 font-display text-4xl font-bold text-primary sm:text-5xl">
              {art.title}
            </h1>

            <p className="mt-3 text-lg text-primary/70">
              <span className="text-primary/40">Уран зураач:</span> {art.artist}
            </p>

            {art.description && (
              <p className="mt-6 max-w-prose text-balance leading-relaxed text-primary/65">
                {art.description}
              </p>
            )}

            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border">
              {META_ROWS.map((row) => (
                <div key={row.key} className="bg-card px-5 py-4">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-primary/40">
                    {row.key}
                  </dt>
                  <dd className="mt-1 font-medium text-primary">
                    {row.get(art)}
                  </dd>
                </div>
              ))}
            </dl>

            {art.price != null && (
              <p className="mt-8 flex items-baseline gap-2">
                <span className="text-sm font-medium uppercase tracking-wider text-primary/40">
                  Үнэ
                </span>
                <span className="font-display text-3xl font-bold text-primary">
                  {formatPrice(art.price)}
                </span>
              </p>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PurchaseRequestTrigger artworkId={art.id} artworkTitle={art.title} />
              <Button href="/gallery" variant="secondary" size="lg">
                Бүх бүтээл
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-6">
              <ShareButtons title={art.title} artist={art.artist} />
            </div>
          </Reveal>
        </div>

        <div className="mt-24">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
                Үргэлжлүүлэн
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-primary sm:text-4xl">
                Төстэй бүтээлүүд
              </h2>
            </div>
            <Link
              href="/gallery"
              className="shrink-0 text-sm font-medium text-primary/60 transition-colors hover:text-accent"
            >
              Бүгдийг харах →
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ArtworkCard
                key={item.id}
                artwork={item}
                showArtist={false}
                subtitle={`${item.medium ?? ""} · ${item.year ?? ""}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
