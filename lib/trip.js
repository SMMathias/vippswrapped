import { supabase, TRIP_SLUG } from "./supabase";

// Henter hele demo-turen i to kald, der kører samtidig:
// 1) turen med personer, udgifter (+ objekt og fordeling), seneste køb og overførsler
// 2) viewet member_balances: hvem skylder hvem
export async function fetchTrip() {
  const [tripRes, balancesRes] = await Promise.all([
    supabase
      .from("trips")
      .select(
        `*,
        members(*),
        expenses(*, category:categories(*), shares:expense_shares(*)),
        recent_purchases(*),
        payments(*)`
      )
      .eq("slug", TRIP_SLUG)
      .single(),
    supabase.from("member_balances").select("*"),
  ]);

  if (tripRes.error) throw tripRes.error;
  if (balancesRes.error) throw balancesRes.error;

  const trip = tripRes.data;

  // Sorteres her i stedet for i forespørgslen, så det er nemt at læse.
  const members = [...trip.members].sort((a, b) => a.sort_order - b.sort_order);
  const expenses = [...trip.expenses].sort(
    (a, b) => new Date(a.purchased_at) - new Date(b.purchased_at)
  );
  const recentPurchases = [...trip.recent_purchases].sort(
    (a, b) => new Date(b.purchased_at) - new Date(a.purchased_at)
  );

  // Saldi i samme rækkefølge som personerne. Numeric kommer som tal fra Supabase.
  const balances = members.map((m) => {
    const b = balancesRes.data.find((row) => row.member_id === m.id);
    return {
      member: m,
      paidTotal: Number(b?.paid_total ?? 0),
      shareTotal: Number(b?.share_total ?? 0),
      balance: Number(b?.balance ?? 0),
      outstanding: Number(b?.outstanding ?? 0),
    };
  });

  return {
    id: trip.id,
    slug: trip.slug,
    name: trip.name,
    startsOn: trip.starts_on,
    endsOn: trip.ends_on,
    status: trip.status, // 'open' | 'settling' | 'settled'
    closedAt: trip.closed_at,
    settledAt: trip.settled_at,
    members,
    me: members.find((m) => m.is_me) ?? null,
    expenses,
    recentPurchases,
    payments: trip.payments,
    balances,
  };
}

// Læsefejl fra Supabase er på engelsk, så de oversættes til én dansk besked.
// (Fejl fra RPC-funktionerne er allerede på dansk og vises direkte.)
export function readErrorMessage(error) {
  if (error?.code === "PGRST116") {
    return "Demo-turen blev ikke fundet.";
  }
  return "Turen kunne ikke hentes. Tjek din forbindelse, og prøv igen.";
}
