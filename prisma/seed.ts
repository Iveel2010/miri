import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================================
// Seed script. Creates demo users (admin/artist/customer), categories and a
// few artworks. Run with: npm run prisma:seed
// ============================================================================

async function main() {
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@artgallery.test" },
    update: {},
    create: {
      name: "Gallery Admin",
      email: "admin@artgallery.test",
      password,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });

  const artist = await prisma.user.upsert({
    where: { email: "artist@artgallery.test" },
    update: {
      verified: true,
      phone: "+976 9911 2233",
      whatsapp: "+976 9911 2233",
      telegram: "misheel_art",
      facebook: "https://facebook.com/misheel.art",
      instagram: "https://instagram.com/misheel.art",
      location: "Ulaanbaatar, Mongolia",
      preferredContactMethod: "WHATSAPP",
      responseTime: "Usually replies within 1 hour",
      showPhone: true,
      showEmail: true,
    },
    create: {
      name: "Misheel",
      email: "artist@artgallery.test",
      password,
      role: Role.ARTIST,
      verified: true,
      bio: "Contemporary painter exploring light and landscape.",
      emailVerified: new Date(),
      phone: "+976 9911 2233",
      whatsapp: "+976 9911 2233",
      telegram: "misheel_art",
      facebook: "https://facebook.com/misheel.art",
      instagram: "https://instagram.com/misheel.art",
      location: "Ulaanbaatar, Mongolia",
      preferredContactMethod: "WHATSAPP",
      responseTime: "Usually replies within 1 hour",
      showPhone: true,
      showEmail: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@artgallery.test" },
    update: {},
    create: {
      name: "Collector Sam",
      email: "customer@artgallery.test",
      password,
      role: Role.CUSTOMER,
      emailVerified: new Date(),
    },
  });

  const categories = await Promise.all(
    ["Painting", "Photography", "Sculpture", "Digital"].map((name) =>
      prisma.category.upsert({
        where: { slug: name.toLowerCase() },
        update: {},
        create: { name, slug: name.toLowerCase() },
      }),
    ),
  );
  const painting = categories[0];

  const artworks = [
    { title: "Sunrise Over the Steppe", price: 1200, year: 2024, medium: "Oil on canvas" },
    { title: "Urban Reflections", price: 850, year: 2023, medium: "Acrylic" },
    { title: "Silent Glacier", price: 2100, year: 2025, medium: "Oil on linen" },
  ];

  for (const a of artworks) {
    const slug = a.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    await prisma.artwork.upsert({
      where: { slug },
      update: {},
      create: {
        title: a.title,
        slug,
        description: `${a.title} — a striking ${a.medium?.toLowerCase()} work.`,
        image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800",
        images: [],
        price: a.price,
        medium: a.medium,
        year: a.year,
        status: "PUBLISHED",
        categoryId: painting.id,
        artistId: artist.id,
        views: Math.floor(Math.random() * 200),
        favoritesCount: Math.floor(Math.random() * 20),
      },
    });
  }

  
  console.log("Seeded users:", [admin.email, artist.email, customer.email].join(", "));
  
  console.log("Log in with password: Password123!");
}

main()
  .catch((e) => {
    
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
