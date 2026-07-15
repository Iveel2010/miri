"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./Button";
import { NavbarAuth } from "./NavbarAuth";
import { useAuth } from "@/lib/auth-client";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
  { label: "Онцгой", href: "/shop" },
  { label: "Холбоо барих", href: "/contact" },
];

export default function Navbar({
  logoText = "Miry",
  logoImage,
}: {
  logoText?: string;
  logoImage?: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, status } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAdmin = status === "authenticated" && (user?.role === "ADMIN" || user?.role === "ARTIST");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border bg-background/70 shadow-sm shadow-accent/5 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
        aria-label="Primary"
      >
        <Link href="/" className="group flex items-center gap-2">
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
              className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-secondary text-white shadow-sm transition-transform duration-300 group-hover:rotate-12"
              aria-hidden="true"
            >
              ✦
            </span>
          )}
          <span className="font-display text-2xl font-bold tracking-tight text-primary">
            {logoText}
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-primary/70 transition-colors hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <NavbarAuth className="hidden md:flex" />
          {isAdmin && (
            <Link
              href="/admin"
              className="hidden rounded-full border border-accent/30 px-3 py-1.5 text-sm font-medium text-accent transition-all duration-300 hover:bg-accent hover:text-white md:inline-flex"
            >
              Gallery Admin
            </Link>
          )}
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-primary transition-colors hover:bg-accent/10 md:hidden"
          >
            {open ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
                />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-6 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-base font-medium text-primary/80 transition-colors hover:bg-accent/10 hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            <NavbarAuth className="mt-2 flex-wrap" />
            <Button
              href="/contact"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setOpen(false)}
            >
              Холбоо барих
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
