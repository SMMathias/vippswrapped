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

// "Oliver", "Laura og Oliver", "Dig, Laura og Oliver"
export function joinNames(names) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} og ${names.at(-1)}`;
}

// Bannerets fire tilstande (Wrapped-regler 4).
export function bannerState(trip) {
  if (trip.status === "settled") {
    return { locked: false, text: "Turens Wrapped er klar", href: "/wrapped", cta: "Se Wrapped" };
  }
  if (trip.status === "settling") {
    const waiting = waitingFor(trip);
    const meWaiting = waiting.some((m) => m.id === trip.me?.id);
    let text;
    if (meWaiting && waiting.length === 1) text = "Wrapped venter kun på dig";
    else if (meWaiting) text = `Wrapped venter på ${waiting.length} personer – også dig`;
    else text = `Wrapped venter på ${joinNames(waiting.map((m) => m.name))}`;
    return { locked: true, text, href: "/status", cta: "Se status" };
  }
  return { locked: true, text: "Turens Wrapped åbner, når alle har betalt", href: null, cta: null };
}
