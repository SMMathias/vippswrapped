// Roller og highlights i Wrapped. Faste regler (ikke AI), se Wrapped-regler i vaulten.
//
// Princip: kun det, en person SELV har betalt (expenses.paid_by), tæller.
// Hver rolle viser tallet bag sig, så den føles retfærdig og kan forklares.

import { formatKr } from "./format";

const NIGHT_START = 22; // kl. 22.00
const NIGHT_END = 5; // til kl. 04.59

// Timen i dansk tid (Berlin har samme tidszone), 0–23.
const hourFormat = new Intl.DateTimeFormat("da-DK", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: "Europe/Copenhagen",
});
function hourOf(iso) {
  return Number(hourFormat.format(new Date(iso)));
}

function isNight(iso) {
  const h = hourOf(iso);
  return h >= NIGHT_START || h < NIGHT_END;
}

export const KIND_LABELS = {
  mad: "Mad",
  kaffe: "Kaffe",
  indkob: "Indkøb",
  transport: "Transport",
  drikke: "Drikke",
  aktivitet: "Aktiviteter",
  andet: "Andet",
};

// ---------- Hjælpere ----------

const sum = (list) => list.reduce((s, e) => s + Number(e.amount), 0);
const earliest = (list) =>
  list.length ? Math.min(...list.map((e) => new Date(e.purchased_at).getTime())) : Infinity;
const priciest = (list) =>
  [...list].sort((a, b) => Number(b.amount) - Number(a.amount))[0] ?? null;
const times = (n) => (n === 1 ? "gang" : "gange");

// Score for en rolle ud fra en liste af personens egne udgifter.
// score = det, der konkurreres på. amount og firstAt bruges ved uafgjort.
function byItems(items, score) {
  return { score, amount: sum(items), firstAt: earliest(items), items };
}

// ---------- Rollerne i fast rækkefølge (1–8) ----------

const ROLES = [
  {
    id: "sneglen",
    name: "Sneglen",
    // Senest betalte sidste overførsel. Kun dem, der skyldte, kan blive Sneglen.
    // Uafgjort: flest ryk.
    score: (m, ctx) => {
      const mine = ctx.trip.payments.filter((p) => p.from_member === m.id);
      if (mine.length === 0 || mine.some((p) => !p.paid_at)) return { score: 0 };
      const last = Math.max(...mine.map((p) => new Date(p.paid_at).getTime()));
      const nudges = mine.reduce((s, p) => s + p.nudge_count, 0);
      return { score: last, amount: nudges, firstAt: 0, items: [], nudges };
    },
    detail: (c) =>
      c.nudges > 0
        ? `Betalte som den sidste · rykket ${c.nudges} ${times(c.nudges)}`
        : "Betalte som den sidste",
  },
  {
    id: "bankdirektoren",
    name: "Bankdirektøren",
    // Mest lagt ud i alt.
    score: (m, ctx) => {
      const items = ctx.paidBy(m.id);
      return byItems(items, sum(items));
    },
    detail: (c) => `Lagde mest ud: ${formatKr(c.score)}`,
  },
  {
    id: "natteravnen",
    name: "Natteravnen",
    // Flest køb kl. 22.00–04.59.
    score: (m, ctx) => {
      const items = ctx.paidBy(m.id).filter((e) => isNight(e.purchased_at));
      return byItems(items, items.length);
    },
    detail: (c) => `Flest køb mellem kl. 22 og 05: ${c.score}`,
  },
  {
    id: "proviantmesteren",
    name: "Proviantmesteren",
    // Mest betalt på indkøb.
    score: (m, ctx) => {
      const items = ctx.paidBy(m.id).filter((e) => e.category?.kind === "indkob");
      return byItems(items, sum(items));
    },
    detail: (c) => `Mest brugt på indkøb: ${formatKr(c.score)}`,
  },
  {
    id: "chaufforen",
    name: "Chaufføren",
    // Mest betalt på transport.
    score: (m, ctx) => {
      const items = ctx.paidBy(m.id).filter((e) => e.category?.kind === "transport");
      return byItems(items, sum(items));
    },
    detail: (c) => `Mest brugt på transport: ${formatKr(c.score)}`,
  },
  {
    id: "kaffejunkien",
    name: "Kaffejunkien",
    // Flest kaffekøb.
    score: (m, ctx) => {
      const items = ctx.paidBy(m.id).filter((e) => e.category?.kind === "kaffe");
      return byItems(items, items.length);
    },
    detail: (c) => `Flest kaffekøb: ${c.score}`,
  },
  {
    id: "snackfiend",
    name: "Snackfiend",
    // Flest madkøb.
    score: (m, ctx) => {
      const items = ctx.paidBy(m.id).filter((e) => e.category?.kind === "mad");
      return byItems(items, items.length);
    },
    detail: (c) => `Flest madkøb: ${c.score}`,
  },
  {
    id: "skyldneren",
    name: "Skyldneren",
    // Største negative saldo ved "afslut og beregn" (balance = lagt ud minus andel).
    score: (m, ctx) => {
      const balance = ctx.trip.balances.find((b) => b.member.id === m.id)?.balance ?? 0;
      return { score: balance < 0 ? -balance : 0, amount: 0, firstAt: 0, items: [] };
    },
    detail: (c) => `Skyldte mest ved opgørelsen: ${formatKr(c.score)}`,
  },
];

// Fallback for dem, der ikke vinder en rolle.
const PASSENGER = {
  id: "passageren",
  name: "Passageren",
  detail: (c) => `Lagde ${formatKr(c.amount)} ud`,
};

// Uafgjort: højeste score → højeste beløb → tidligste køb → turens rækkefølge.
function compareCandidates(a, b) {
  return (
    b.score - a.score ||
    b.amount - a.amount ||
    a.firstAt - b.firstAt ||
    a.member.sort_order - b.member.sort_order
  );
}

// Fordeler rollerne: én rolle pr. person og én person pr. rolle.
// Gå rollerne igennem i rækkefølge, og giv rollen til den person uden rolle,
// der har højest score (> 0). Resten bliver Passageren.
// Returnerer én række pr. person i turens rækkefølge.
export function assignRoles(trip) {
  const ctx = {
    trip,
    paidBy: (memberId) => trip.expenses.filter((e) => e.paid_by === memberId),
  };
  const assigned = new Map();

  for (const role of ROLES) {
    const best = trip.members
      .filter((m) => !assigned.has(m.id))
      .map((m) => ({ member: m, ...role.score(m, ctx) }))
      .filter((c) => c.score > 0)
      .sort(compareCandidates)[0];

    if (best) {
      assigned.set(best.member.id, {
        member: best.member,
        role,
        detail: role.detail(best),
        // Tallet og købene bag rollen, så rollesiden kan vise beviset (F14–F17).
        score: best.score,
        items: best.items,
        // Objektet, der "beviser" rollen (det dyreste af de køb, der talte med).
        object: priciest(best.items),
      });
    }
  }

  return trip.members.map((m) => {
    if (assigned.has(m.id)) return assigned.get(m.id);
    const items = ctx.paidBy(m.id);
    return {
      member: m,
      role: PASSENGER,
      detail: PASSENGER.detail({ amount: sum(items) }),
      score: sum(items),
      items,
      object: priciest(items),
    };
  });
}

// ---------- Highlights ----------

export function highlights(trip) {
  const total = sum(trip.expenses);
  const mostExpensive = priciest(trip.expenses);

  // Mest populære kategori: flest udgifter pr. kind ("andet" tæller ikke).
  // Uafgjort: højeste sum.
  const byKind = new Map();
  for (const e of trip.expenses) {
    const kind = e.category?.kind;
    if (!kind || kind === "andet") continue;
    const list = byKind.get(kind) ?? [];
    list.push(e);
    byKind.set(kind, list);
  }
  const popular = [...byKind.entries()]
    .map(([kind, items]) => ({ kind, label: KIND_LABELS[kind], count: items.length, total: sum(items), object: priciest(items) }))
    .sort((a, b) => b.count - a.count || b.total - a.total)[0] ?? null;

  return {
    total,
    perPerson: trip.members.length ? total / trip.members.length : 0,
    count: trip.expenses.length,
    mostExpensive,
    popular,
  };
}
