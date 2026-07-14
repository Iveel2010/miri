import About from "@/components/About";
import Reveal from "@/components/Reveal";
import { SectionTitle } from "@/components/SectionTitle";
import { Button } from "@/components/Button";
import { ArtworkCard } from "@/components/ArtworkCard";
import { serverApiList } from "@/lib/server-api";
import { toArtworks } from "@/lib/mappers";
import type { ApiArtwork } from "@/types/api";

export const dynamic = "force-dynamic";

const VALUES = [
  {
    icon: "🌸",
    title: "Зөөлөн мэдрэмж",
    text: "Бүтээл бүр амралт, амгалан мэдрэмж төрүүлэхийг зорьно. Жижигхэн дэлгэц дээр ч гэсэн амьсгалах юм шиг.",
  },
  {
    icon: "🎨",
    title: "Гараар бүтээсэн",
    text: "Акрил, усан будгаас дижитал хүртэл — бүх зүйл гар, зүрх, тэр мөчийн сэтгэл зохицоогоор бүтдэг.",
  },
  {
    icon: "🌿",
    title: "Байгалийн аялга",
    text: "Цэцэг, хээр, үүр — байгалийн зөөлөн талууд миний хамгийн том санааны эх сурвалж.",
  },
];

const TIMELINE = [
  { year: "2016", text: "Анхны хувь хэрэглээний зураг, эхлэл" },
  { year: "2019", text: "Эхний хувийн үзэсгэлэн — «Зөөлөн өглөө»" },
  { year: "2022", text: "Дижитал урлагт шилжин, шинэ ертөнц нээгдэв" },
  { year: "2024", text: "200+ бүтээл, олон улсын жижиг үзэсгэлэн" },
];

export default async function AboutPage() {
  const { items } = await serverApiList<ApiArtwork>(
    "/api/artworks?limit=3&sort=popular",
  );

  const FEATURED = toArtworks(items ?? []);

  return (
    <>
      {/* Intro header */}
      <section className="px-6 pb-4 pt-32 md:pt-40">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-xl text-accent shadow-sm">
            ✦
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            Миний тухай
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold text-primary sm:text-6xl">
            Танилцъя
          </h1>
          <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        </Reveal>
      </section>

      {/* Bio + portrait + stats */}
      <About />
    </>
  );
}
