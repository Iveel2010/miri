import Image from "next/image";
import Reveal from "./Reveal";
import { Button } from "./Button";
import { safeServerApi } from "@/lib/server-api";

export const dynamic = "force-dynamic";

export default async function Hero() {
  const data = await safeServerApi<{
    heroImage: string;
    heroTitle: string;
    heroSubtitle: string;
    heroBadge: string;
    heroCaption: string;
  } | null>("/api/site-settings/hero", null);

  const titleLines = (data?.heroTitle ?? "Урлаг\nболон Мэдрэмж").split("\n");

  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-32 md:pb-28 md:pt-40">
      <span
        className="pointer-events-none absolute right-24 bottom-32 text-xl text-accent-secondary animate-float-delay"
        aria-hidden="true"
      >
        ✿
      </span>

      <Reveal className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
            ✦ {data?.heroBadge ?? "Мишээлийн урлаг"}
          </span>
          <h1 className="mt-6 font-display text-4xl font-bold leading-[1.12] text-primary sm:text-5xl lg:text-6xl">
            {titleLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < titleLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-primary/60 lg:mx-0">
            {data?.heroSubtitle ??
              "Би Мишээл — будгаар болон дижиталээр зөөлөн, мөрөөдлийн жаахан ертөнцүүдийг бүтээдэг уран зураач. Миний тайван буланд тавтай морилно уу."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
            <Button href="/gallery" size="lg">
              Бүтээл харах
              <span aria-hidden="true">&rarr;</span>
            </Button>
            <Button href="/about" variant="secondary" size="lg">
              Миний тухай
              <span aria-hidden="true">&rarr;</span>
            </Button>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative rounded-[2rem] border border-white/60 bg-white/40 p-3 shadow-2xl shadow-accent/10 backdrop-blur-md">
            <div className="absolute -right-3 -top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white shadow-lg animate-float">
              ✦
            </div>
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem]">
              <Image
                src={
                  data?.heroImage ??
                  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&h=1125&fit=crop&crop=center"
                }
                alt="Мишээлийн зөөлөн, мөрөөдлийн абстракт зураг"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
            <p className="px-2 pb-1 pt-3 text-center font-display text-sm italic text-primary/60">
              {data?.heroCaption ?? "Амархан Цэцэг — Мишээл, 2024"}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
