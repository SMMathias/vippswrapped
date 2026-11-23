// Lige fordeling med samme regel som _insert_expense i Supabase:
// alle får beløbet delt med antal personer, rundet ned til hele øre.
// De øre, der bliver tilovers, går til betaleren (eller den første, hvis
// betaleren ikke er med). Der regnes i øre, så kommatal ikke giver afrundingsfejl.
//
// members: personerne, der er med, i turens rækkefølge (sort_order)
// Returnerer et Map: member.id -> beløb i kr.
export function splitEvenly(amount, members, payerId) {
  const result = new Map();
  if (members.length === 0) return result;

  const totalOre = Math.round(Number(amount) * 100);
  const shareOre = Math.floor(totalOre / members.length);
  const restOre = totalOre - shareOre * members.length;

  const first = members.find((m) => m.id === payerId) ?? members[0];
  for (const m of members) {
    const ore = shareOre + (m.id === first.id ? restOre : 0);
    result.set(m.id, ore / 100);
  }
  return result;
}
