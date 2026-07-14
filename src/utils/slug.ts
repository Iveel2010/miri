// ============================================================================
// Small string utilities.
// ============================================================================

/** Convert a title to a URL-safe slug; appends a suffix when `taken` matches. */
export function slugify(input: string, suffix = ""): string {
  const base = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return suffix ? `${base}-${suffix}` : base;
}

/** Ensure a slug is unique by appending a short random/sequence suffix. */
export async function uniqueSlug(
  input: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = slugify(input);
  let slug = root;
  for (let i = 1; i <= 5; i++) {
    if (!(await exists(slug))) return slug;
    slug = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}
