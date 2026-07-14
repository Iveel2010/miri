"use client";

import { useEffect, useState, useRef } from "react";
import Reveal from "@/components/Reveal";
import { Button } from "@/components/Button";
import { apiGet, apiPost } from "@/lib/api-client";
import type { ApiSiteSettings, ApiSiteContact } from "@/types/api";

const DEFAULT_CONTACT: ApiSiteContact = {
  email: "contact.miri.art@gmail.com",
  studio: "Улаанбаатар, Монгол",
  hours: "Даваа–Баасан · 10:00–18:00",
  socials: [
    { label: "Instagram", href: "https://instagram.com/miri.art.studio" },
    { label: "Facebook", href: "https://facebook.com/MiriArtStudio" },
  ],
};

function buildContacts(contact: ApiSiteContact) {
  return [
    { icon: "💌", label: "Gmail", value: contact.email, href: `mailto:${contact.email}` },
    { icon: "📍", label: "Студио", value: contact.studio },
    { icon: "🕒", label: "Цаг", value: contact.hours },
  ];
}

export default function ContactPage() {
  const [contact, setContact] = useState<ApiSiteContact>(DEFAULT_CONTACT);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let active = true;
    apiGet<ApiSiteSettings>("/api/site-settings")
      .then((d) => {
        if (active && d.contact) setContact(d.contact);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      name: (form.get("name") as string) || "",
      email: (form.get("email") as string) || "",
      subject: (form.get("subject") as string) || "",
      body: (form.get("message") as string) || "",
    };

    try {
      await apiPost("/api/contact", data);
      setSent(true);
      formRef.current?.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Алдаа гарлаа. Дахин оролдоно уу.");
    }
  };

  const contacts = buildContacts(contact);
  const socials = contact.socials ?? [];

  return (
    <section className="px-6 pb-24 pt-32 md:pt-40">
      <div className="mx-auto max-w-6xl">
        <Reveal className="text-center">
          <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-xl text-accent shadow-sm">
            ✦
          </span>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
            Холбоо барих
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold text-primary sm:text-6xl">
            MIRI-д зочилсонд баярлалаа.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-balance text-primary/60">
            Хэрэв танд захиалгат бүтээл хийлгэх, хамтран ажиллах, эсвэл зүгээр
            л санал, сэтгэгдлээ хуваалцах хүсэл байвал надтай холбогдоорой.
            Таны илгээсэн зурвас бүрийг анхааралтай уншиж, хамгийн ойрын
            хугацаанд хариу өгөх болно.❤️
          </p>
          <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
        </Reveal>

        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Contact info */}
          <Reveal>
            <div className="space-y-4">
              {contacts.map((item) => {
                const inner = (
                  <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/10">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-xl">
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary/40">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-primary">{item.value}</p>
                    </div>
                  </div>
                );
                return item.href ? (
                  <a key={item.label} href={item.href} className="block">
                    {inner}
                  </a>
                ) : (
                  <div key={item.label}>{inner}</div>
                );
              })}

              <div className="rounded-2xl border border-border bg-gradient-to-br from-accent-secondary/30 to-accent/20 p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary/50">
                  Биднийг дагаарай 🥰
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {socials.map((s, i) => (
                    <a
                      key={`${s.label}-${i}`}
                      href={s.href || "#"}
                      className="rounded-full border border-accent/30 px-4 py-2 text-sm font-medium text-accent transition-all duration-300 hover:bg-accent hover:text-white"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={120}>
            <form
              ref={formRef}
              onSubmit={onSubmit}
              className="space-y-4 rounded-[2rem] border border-border bg-card p-8 shadow-sm"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1.5 block text-sm font-medium text-primary/70"
                  >
                    Нэр
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Таны нэр"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-sm font-medium text-primary/70"
                  >
                    И-мэйл
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-1.5 block text-sm font-medium text-primary/70"
                >
                  Сэдэв
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  placeholder="Захиалга, асуулт..."
                  className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1.5 block text-sm font-medium text-primary/70"
                >
                  Зурвас
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Өөрийнхөө тухай бичээрэй..."
                  className="w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent"
                />
              </div>

              {error && <p className="text-center text-sm text-red-500">{error}</p>}

              <Button type="submit" size="lg" className="w-full">
                {sent ? "Илгээгдлээ ✦" : "Зурвас илгээх ✦"}
              </Button>

              {sent && (
                <p className="text-center text-sm text-accent">
                  Баярлалаа! Таны зурвасыг хүлээж авлаа — удахгүй хариулна.
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

