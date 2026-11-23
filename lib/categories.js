// Samme regel som SQL-funktionen match_category i Supabase, så objektet kan
// vises i klienten, før købet er delt: det længste nøgleord, der står i navnet,
// vinder. Findes der intet, bruges fallback-objektet (cloche).
export function matchCategory(title, categories) {
  const text = title.toLowerCase();
  let best = null;
  let bestLength = 0;

  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (text.includes(keyword) && keyword.length > bestLength) {
        best = category;
        bestLength = keyword.length;
      }
    }
  }

  return best ?? categories.find((c) => c.is_fallback) ?? null;
}

// Billederne ligger i public/3d/ med samme filnavn som categories.image.
export function objectSrc(category) {
  return `/3d/${category?.image ?? "3d-cloche.png"}`;
}
