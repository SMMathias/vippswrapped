// Rene funktioner, der læser turens tilstand. De bruges af banneret,
// status-siden og senere Wrapped, så reglerne kun står ét sted.
// Se Wrapped-regler i vaulten (afsnit 3–5).

export function nameOf(trip, memberId) {
  return trip.members.find((m) => m.id === memberId)?.name ?? "Ukendt";
}

// Samlet beløb for alle udgifter på turen.
export function tripTotal(trip) {
  return trip.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
}

// Personer, der stadig har mindst én ubetalt overførsel, i turens rækkefølge.
export function waitingFor(trip) {
  const ids = new Set(trip.payments.filter((p) => !p.paid_at).map((p) => p.from_member));
  return trip.members.filter((m) => ids.has(m.id));
}

// Man må kun rykke andre, når man ikke selv mangler at betale (Wrapped-regler 5).
export function canNudge(trip) {
  return !waitingFor(trip).some((m) => m.id === trip.me?.id);
}

// "Oliver", "Laura og Oliver", "dig, Laura og Oliver"
export function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} og ${names.at(-1)}`;
}

// Bannerets fire tilstande (Wrapped-regler 4). Test runde 2: teksten siger nu
// i én sætning, hvem der mangler at betale, og hvad det betyder for Wrapped.
export function bannerState(trip) {
  if (trip.status === "settled") {
    return { locked: false, text: "Turens Wrapped er klar", href: "/wrapped", cta: "Se Wrapped" };
  }
  if (trip.status === "settling") {
    return {
      locked: true,
      text: `Wrapped åbner, når ${waitingNames(trip)} har betalt`,
      href: "/status",
      cta: "Se status",
    };
  }
  return { locked: true, text: "Wrapped åbner, når alle har betalt", href: null, cta: null };
}

// Til "… når X har betalt": "du", "Laura og Oliver", "du, Laura og Oliver".
// Du står først, så man ser sig selv. "alle", hvis listen er tom.
export function waitingNames(trip) {
  const waiting = waitingFor(trip);
  const me = waiting.filter((m) => m.id === trip.me?.id).map(() => "du");
  const others = waiting.filter((m) => m.id !== trip.me?.id).map((m) => m.name);
  return joinNames([...me, ...others]) || "alle";
}
