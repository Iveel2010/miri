import type { Prisma } from "@prisma/client";
import { siteSettingRepository } from "@/repositories/site-setting.repository";

export type SiteHeroSettings = {
  heroImage: string;
  heroTitle: string;
  heroSubtitle: string;
  heroBadge: string;
  heroCaption: string;
};

export type SiteStat = { value: string; label: string; icon: string };

export type SiteSocial = { label: string; href: string };

export type SiteContact = {
  email: string;
  studio: string;
  hours: string;
  socials: SiteSocial[];
};

export type SiteSettings = {
  logoText: string;
  logoImage: string;
  artistPhoto: string;
  aboutName: string;
  aboutSubtitle: string;
  aboutBio: string;
  aboutStats: SiteStat[];
  contact: SiteContact;
};

export const defaultHeroSettings: SiteHeroSettings = {
  heroImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&h=1125&fit=crop&crop=center",
  heroTitle: "Таны мэдрэмжийг\nмөнхөлнө",
  heroSubtitle: "Намайг Мишээл гэдэг. Дүрслэх урлагаар дамжуулан хүмүүсийн дотоод мэдрэмж, сэтгэл хөдлөл, нандин дурсамж үе мөчүүдийг зургаар илэрхийлэхийг зорьдог уран бүтээлч. MIRI-д тавтай морил. 🥰❤️",
  heroBadge: "MIRI",
  heroCaption: "Амархан Цэцэг — Мишээл, 2024",
};

export const defaultSiteSettings: SiteSettings = {
  logoText: "Miry",
  logoImage: "",
  artistPhoto: "/misheel.jpg",
  aboutName: "Сайн уу, би Мишээл 🌸",
  aboutSubtitle:
    "Би бацхан№, зөөлөн ертөнцүүдийг — уужим амьсгал мэт мэдрэгдэх газруудыг зурдаг. Миний бүтээлүүд зөөлөн үүрүүд, хол хээрээрх цэцэрлэгүүд болон бид ховор нээлттэй хэлдэг жаахан мэдрэмжүүдээс санаа авдаг. Бүтээл бүр гараараа, нэг нэгэн зөөлөн давхаргаар хийгддэг.",
  aboutBio: "",
  aboutStats: [
    { value: "8+", label: "Жил зураг", icon: "🎨" },
    { value: "200+", label: "Уран бүтээл", icon: "🖼️" },
    { value: "12", label: "Үзэсгэлэн", icon: "🏛️" },
  ],
  contact: {
    email: "contact.miri.art@gmail.com",
    studio: "Улаанбаатар, Монгол",
    hours: "Даваа–Баасан · 10:00–18:00",
    socials: [
      { label: "Instagram", href: "https://instagram.com/miri.art.studio" },
      { label: "Facebook", href: "https://facebook.com/MiriArtStudio" },
    ],
  },
};

export const siteSettingService = {
  async getHero() {
    const setting = await siteSettingRepository.findOne("hero");
    const data = (setting?.value ?? {}) as Partial<SiteHeroSettings>;
    return { ...defaultHeroSettings, ...data };
  },

  async updateHero(input: Partial<SiteHeroSettings>) {
    const current = await siteSettingRepository.findOne("hero");
    const currentValue = (current?.value ?? defaultHeroSettings) as SiteHeroSettings;
    const nextInput = { ...currentValue, ...input };
    const updated = await siteSettingRepository.upsert("hero", nextInput as Prisma.InputJsonValue);
    return updated.value as SiteHeroSettings;
  },

  async getSite() {
    const setting = await siteSettingRepository.findOne("site");
    const data = (setting?.value ?? {}) as Partial<SiteSettings>;
    return { ...defaultSiteSettings, ...data };
  },

  async updateSite(input: Partial<SiteSettings>) {
    const current = await siteSettingRepository.findOne("site");
    const currentValue = (current?.value ?? defaultSiteSettings) as SiteSettings;
    const next = { ...currentValue, ...input };
    const updated = await siteSettingRepository.upsert("site", next as Prisma.InputJsonValue);
    return updated.value as SiteSettings;
  },
};
