import Reveal from "./Reveal";

interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  id?: string;
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  align = "center",
  id,
}: SectionTitleProps) {
  return (
    <Reveal
      className={align === "center" ? "text-center" : "text-left"}
    >
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          {eyebrow}
        </p>
      )}
      <h2
        id={id}
        className="mt-3 font-display text-3xl font-bold text-primary sm:text-4xl"
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 max-w-xl text-primary/60 ${
            align === "center" ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
