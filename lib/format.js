// Beløb som i Vipps: "840 kr." og "333,33 kr." (kun decimaler, når der er øre).
export function formatKr(amount) {
  const n = Number(amount);
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    currencyDisplay: "code",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  })
    .format(n)
    .replace("DKK", "kr.")
    .trim();
}

// Turen foregår i Berlin, men tiderne vises i dansk tid (samme tidszone).
const TZ = "Europe/Copenhagen";

// "6.–8. nov."
export function formatDateRange(startsOn, endsOn) {
  const start = new Date(startsOn);
  const end = new Date(endsOn);
  const day = (d) => d.toLocaleDateString("da-DK", { day: "numeric", timeZone: TZ });
  const month = end.toLocaleDateString("da-DK", { month: "short", timeZone: TZ });
  return `${day(start)}–${day(end)} ${month}`;
}

// "fre. 6. nov. kl. 16.30"
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString("da-DK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  });
}
