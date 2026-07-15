import Image from "next/image";
import Link from "next/link";

const QUICK_LINKS = [
  { label: "Нүүр", href: "/" },
  { label: "Урлас", href: "/gallery" },
  { label: "Тухай", href: "/about" },
  { label: "Холбоо барих", href: "/contact" },
];

const SOCIALS = [
  {
    label: "Instagram",
    href: "https://instagram.com/miri.art.studio",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  },
  {
    label: "Facebook",
    href: "https://facebook.com/MiriArtStudio",
    path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  },
  {
    label: "Email",
    href: "mailto:contact.miri.art@gmail.com",
    path: "M2.25 6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 19.5h-15a2.25 2.25 0 01-2.25-2.25V6.75zm16.5 1.5L12 12.75 5.25 8.25",
  },
];

export default function Footer({
  logoText = "Miry",
  logoImage,
}: {
  logoText?: string;
  logoImage?: string;
}) {
  return (
    <footer className="bg-primary px-6 pb-8 pt-16 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2">
            {logoImage ? (
              <Image
                key={logoImage}
                src={logoImage}
                alt={logoText}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white"
                aria-hidden="true"
              >
                ✦
              </span>
            )}
            <span className="font-display text-2xl font-bold">{logoText}</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
            Мишээлийн гараар зурсан зөөлөн, мөрөөдлийн жаахан ертөнцүүд.
          </p>
        </div>

        <nav aria-label="Footer" className="md:justify-self-center">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
            Судлах
          </h3>
          <ul className="mt-4 space-y-3 text-sm text-white/60">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="transition-colors hover:text-accent-secondary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:justify-self-end">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/70">
            Сайн уу
          </h3>
          <div className="mt-4 flex gap-4">
            {SOCIALS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/70 transition-all hover:scale-110 hover:bg-white/10 hover:text-accent-secondary"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d={social.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-center text-sm text-white/40">
        &copy; {new Date().getFullYear()} Miry · Мишээлийн урлаг. Хайр
        сэтгэлээр бүтээгдсэн &hearts;.
      </div>
    </footer>
  );
}
