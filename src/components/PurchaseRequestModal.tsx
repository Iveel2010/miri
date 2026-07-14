"use client";

import { useEffect, useState, useCallback } from "react";
import { apiPost } from "@/lib/api-client";

interface PurchaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkId: string;
  artworkTitle: string;
}

export default function PurchaseRequestModal({
  isOpen,
  onClose,
  artworkId,
  artworkTitle,
}: PurchaseRequestModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = useCallback(() => {
    setName("");
    setPhone("");
    setEmail("");
    setMessage("");
    setErrors({});
    setSubmitting(false);
    setSuccess(false);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(reset, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Нэр шаардлагатай";
    if (!phone.trim()) next.phone = "Утасны дугаар шаардлагатай";
    else if (!/^[+]?[\d\s()\-]{7,20}$/.test(phone.trim()))
      next.phone = "Зөв утасны дугаар оруулна уу";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Зөв и-мэйл оруулна уу";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      await apiPost(`/api/artworks/${artworkId}/purchase-request`, {
        buyerName: name.trim(),
        buyerPhone: phone.trim(),
        buyerEmail: email.trim() || null,
        message: message.trim() || null,
      });
      setSuccess(true);
    } catch {
      setErrors({ _form: "Алдаа гарлаа. Дахин оролдоно уу." });
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-primary/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-accent/10">
        <div className="p-8 sm:p-10">
          {!success ? (
            <>
              <div className="text-center">
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl text-accent">
                  ✦
                </span>
                <h2 className="font-display text-2xl font-bold text-primary">
                  Худалдан авах хүсэлт
                </h2>
                <p className="mt-2 text-sm text-primary/60">
                  «{artworkTitle}» бүтээлийг худалдан авахыг хүсч байна уу?{" "}
                  <span className="font-medium text-primary">
                    Уран зураач удахгүй холбогдоно.
                  </span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label
                    htmlFor="pr-name"
                    className="mb-1.5 block text-sm font-medium text-primary/70"
                  >
                    Нэр <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pr-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Таны бүтэн нэр"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pr-phone"
                    className="mb-1.5 block text-sm font-medium text-primary/70"
                  >
                    Утасны дугаар <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="pr-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+976 0000 0000"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pr-email"
                    className="mb-1.5 block text-sm font-medium text-primary/70"
                  >
                    И-мэйл{" "}
                    <span className="text-primary/40">(заавал биш)</span>
                  </label>
                  <input
                    id="pr-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="pr-message"
                    className="mb-1.5 block text-sm font-medium text-primary/70"
                  >
                    Зурвас{" "}
                    <span className="text-primary/40">(заавал биш)</span>
                  </label>
                  <textarea
                    id="pr-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Хүслийнхээ тухай товч мэдээлэл..."
                    className="w-full resize-none rounded-2xl border border-border bg-white px-4 py-3 text-primary outline-none transition-colors placeholder:text-primary/40 focus:border-accent"
                  />
                </div>

                {errors._form && (
                  <p className="text-center text-sm text-red-500">
                    {errors._form}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="flex-1 rounded-full border border-border px-6 py-3 text-sm font-medium text-primary/70 transition-all duration-300 hover:border-primary/30 hover:text-primary disabled:opacity-50"
                  >
                    Болих
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-accent/30 disabled:opacity-60"
                  >
                    {submitting ? "Илгээж байна..." : "Хүсэлт илгээх"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-display text-2xl font-bold text-primary">
                Баярлалаа!
              </h3>
              <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-primary/70">
                Thank you! The artist will contact you shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  onClose();
                }}
                className="mt-8 rounded-full bg-accent px-8 py-3 text-sm font-medium text-white shadow-sm transition-all duration-300 hover:brightness-110 hover:shadow-lg hover:shadow-accent/30"
              >
                За
              </button>
            </div>
          )}
        </div>

        {!success && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-primary/40 transition-colors hover:bg-primary/5 hover:text-primary"
            aria-label="Close"
          >
            <svg
              className="h-5 w-5"
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
          </button>
        )}
      </div>
    </div>
  );
}
