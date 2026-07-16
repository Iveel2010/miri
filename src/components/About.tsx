import Reveal from "./Reveal";
import { SectionTitle } from "./SectionTitle";
import { serverApi } from "@/lib/server-api";
import SafeImage from "./SafeImage";

const DEFAULT_STATS = [
  { value: "8+", label: "Жил зураг", icon: "🎨" },
  { value: "200+", label: "Уран бүтээл", icon: "🖼️" },
  { value: "12", label: "Үзэсгэлэн", icon: "🏛️" },
];

export const dynamic = "force-dynamic";

export default async function About() {
  const data = await serverApi<{
    artistPhoto: string;
    aboutName: string;
    aboutSubtitle: string;
    aboutBio: string;
    aboutStats: { value: string; label: string; icon: string }[];
  }>("/api/site-settings").catch(() => null);

  const artistPhoto = data?.artistPhoto || "/misheel.jpg";
  const aboutName = data?.aboutName || "Сайн уу, би Мишээл 🌸";
  const aboutSubtitle =
    data?.aboutSubtitle ||
    "Би бацхан№, зөөлөн ертөнцүүдийг — уужим амьсгал мэт мэдрэгдэх газруудыг зурдаг.";
  const aboutBio = data?.aboutBio || "";
  const stats = data?.aboutStats?.length ? data.aboutStats : DEFAULT_STATS;

  return (
    <section className="px-6 py-20 md:py-28" aria-labelledby="about-heading">
      <Reveal className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Artist portrait */}
        <div className="relative mx-auto w-full max-w-sm">
          <div
            className="absolute -inset-4 rounded-[3rem] bg-gradient-to-br from-accent-secondary/30 to-accent/30 blur-sm"
            aria-hidden="true"
          />
          <div className="relative overflow-hidden rounded-[2rem] border-4 border-white shadow-2xl">
            <div className="relative aspect-[4/5]">
              <SafeImage
                key={artistPhoto}
                src={artistPhoto}
                fallbackSrc="/misheel.jpg"
                alt="Уран зураач Мишээлийн дүр зураг"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </div>
          <span
            className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg animate-float"
            aria-hidden="true"
          >
            ✦
          </span>
          <span
            className="absolute -bottom-3 left-6 rounded-full bg-white px-4 py-1.5 font-display text-sm font-semibold text-primary shadow-md"
            aria-hidden="true"
          >
            Мишээл
          </span>
        </div>

        {/* Bio + stats */}
        <div className="space-y-8">
          <SectionTitle
            align="left"
            title={aboutName}
            subtitle={aboutSubtitle}
            id="about-heading"
          />
          {aboutBio && (
            <p className="text-sm leading-relaxed text-primary/60">
              {aboutBio}
            </p>
          )}
          <dl className="grid grid-cols-3 gap-4 text-center">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block text-3xl" aria-hidden="true">
                    {stat.icon}
                  </span>
                  <span className="mt-2 block text-2xl font-bold text-accent">
                    {stat.value}
                  </span>
                  <span className="block text-xs text-primary/60">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  );
}
