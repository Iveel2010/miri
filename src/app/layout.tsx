import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/lib/auth-client";
import { serverApi } from "@/lib/server-api";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  variable: "--font-playfair",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Miry — Мишээлийн урлаг",
  description:
    "Miry бол Мишээл — будгийн болон дижитал орчинд зөөлөн, мөрөөдлийн жаахан ертөнцүүдийг бүтээдэг уран зураачийн тайван булан. Анхны бүтээл, хэвлэл болон бусад ихийг судлаарай.",
  keywords: [
    "Мишээл",
    "Miry",
    "уран зураач",
    "зураг",
    "абстракт урлаг",
    "хэвлэл",
  ],
  authors: [{ name: "Misheel" }],
  openGraph: {
    title: "Miry — Мишээлийн урлаг",
    description:
      "Мишээлийн зөөлөн, мөрөөдлийн анхны уран бүтээлүүд.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Miry — Мишээлийн урлаг",
    description: "Мишээлийн зөөлөн, мөрөөдлийн уран бүтээлүүд.",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const site = await serverApi<{ logoText: string; logoImage: string }>(
    "/api/site-settings",
  ).catch(() => null);

  return (
    <html lang="mn">
      <body
        className={`${inter.variable} ${playfair.variable} font-sans bg-background text-primary antialiased`}
      >
        <AuthProvider>
          <Navbar logoText={site?.logoText} logoImage={site?.logoImage} />
          <main>{children}</main>
          <Footer logoText={site?.logoText} logoImage={site?.logoImage} />
        </AuthProvider>
      </body>
    </html>
  );
}
