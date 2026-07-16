import { z } from "zod";

export const artworkInputSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  image: z.string().min(1),
  images: z.array(z.string().min(1)).optional(),
  price: z.coerce.number().nonnegative(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  medium: z.string().max(80).optional(),
  width: z.coerce.number().positive().optional(),
  height: z.coerce.number().positive().optional(),
  year: z.coerce.number().int().min(0).max(new Date().getFullYear()).optional(),
  status: z.enum(["DRAFT", "PENDING", "PUBLISHED", "ARCHIVED"]).optional(),
  isFeatured: z.boolean().optional(),
});

export const artistContactSchema = z.object({
  phone: z.string().max(40).optional().nullable(),
  email: z.string().max(120).optional().nullable(),
  whatsapp: z.string().max(40).optional().nullable(),
  telegram: z.string().max(40).optional().nullable(),
  facebook: z.string().max(200).optional().nullable(),
  instagram: z.string().max(200).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  preferredContactMethod: z.enum(["PHONE", "EMAIL", "FACEBOOK", "INSTAGRAM", "TELEGRAM", "WHATSAPP"]).optional().nullable(),
  responseTime: z.string().max(120).optional().nullable(),
  showPhone: z.boolean().optional(),
  showEmail: z.boolean().optional(),
});

export const siteSettingsSchema = z.object({
  logoText: z.string().max(40).optional(),
  logoImage: z.string().optional(),
  artistPhoto: z.string().optional(),
  aboutName: z.string().max(120).optional(),
  aboutSubtitle: z.string().max(2000).optional(),
  aboutBio: z.string().max(4000).optional(),
  aboutStats: z
    .array(z.object({ value: z.string().max(20), label: z.string().max(40), icon: z.string().max(8) }))
    .max(6)
    .optional(),
  contact: z
    .object({
      email: z.string().max(120),
      studio: z.string().max(120),
      hours: z.string().max(120),
      socials: z
        .array(z.object({ label: z.string().max(40), href: z.string().max(200) }))
        .max(8),
    })
    .optional(),
});

export const heroSettingsSchema = z.object({
  heroImage: z.string().max(500).optional(),
  heroTitle: z.string().max(200).optional(),
  heroSubtitle: z.string().max(2000).optional(),
  heroBadge: z.string().max(40).optional(),
  heroCaption: z.string().max(200).optional(),
});
