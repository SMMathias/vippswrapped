"use client";

import { useRouter } from "next/navigation";
import { useTrip } from "@/app/trip-provider";
import { useRpc } from "@/app/use-rpc";
import { nameOf } from "@/lib/status";
import { formatKr } from "@/lib/format";
import styles from "./demo-controls.module.css";

// Demo-styring til test og eksamen. Findes ikke i den rigtige app.
// Der er intet login, så her kan man lade de andre betale og starte forfra.
// Al skrivning går stadig gennem RPC-funktionerne (pay_payment, reset_demo).
export function DemoControls() {
  const router = useRouter();
  const { trip, setLastAddedId } = useTrip();
  const { run, busy, error } = useRpc();

  if (!trip) return null;

  // Ubetalte overførsler fra de andre (ikke fra "Dig").
  const othersUnpaid = trip.payments.filter(
    (p) => !p.paid_at && p.from_member !== trip.me?.id
  );

  async function reset() {
    const { ok } = await run("reset", "reset_demo", {}, "Demoen kunne ikke nulstilles.");
    if (ok) {
      setLastAddedId(null);
      router.push("/");
    }
  }

  return (
    <details className={styles.demo}>
      <summary className="text-label-md">Demo-styring (kun til test)</summary>
      <div className={styles.body}>
        <p className="text-body-sm">
          Studieprojektet har intet login. Her kan du lade de andre betale og starte forfra.
        </p>

        {othersUnpaid.map((p) => {
          const from = nameOf(trip, p.from_member);
          const to = nameOf(trip, p.to_member);
          return (
            <button
              key={p.id}
              type="button"
              className="btn btn-secondary"
              disabled={busy !== null}
              onClick={() =>
                run(p.id, "pay_payment", { p_payment_id: p.id }, "Betalingen kunne ikke gennemføres.")
              }
            >
              {busy === p.id ? "Betaler …" : `Lad ${from} betale ${to} ${formatKr(p.amount)}`}
            </button>
          );
        })}

        <button type="button" className="btn btn-secondary" disabled={busy !== null} onClick={reset}>
          {busy === "reset" ? "Nulstiller …" : "Nulstil demo"}
        </button>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
