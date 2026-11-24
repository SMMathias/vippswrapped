"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useTrip } from "../../trip-provider";
import { useRpc } from "../../use-rpc";
import { nameOf } from "@/lib/status";
import { formatKr } from "@/lib/format";
import { play, unlockAudio } from "@/lib/feedback";
import { ErrorState, LoadingState } from "@/components/states";
import { TopBar } from "@/components/top-bar";
import styles from "./page.module.css";

// F06 Betal: én betaling ad gangen, som når man betaler i Vipps.
// Adressen er /betal/<betalingens id>, fx /betal/p1.
export default function BetalPage() {
  const { id } = useParams();
  const { trip, loading, error, reload } = useTrip();
  const payment = trip?.payments.find((p) => p.id === id);

  return (
    <main className={styles.page}>
      <TopBar title="Betal til" backHref="/status" backLabel="Tilbage til gør op" />
      {!trip && loading && <LoadingState />}
      {!trip && !loading && <ErrorState message={error} onRetry={reload} />}
      {trip && !payment && (
        <p className={styles.missing}>
          Betalingen findes ikke længere. <Link href="/status">Gå til gør op</Link>
        </p>
      )}
      {trip && payment && <Betal trip={trip} payment={payment} />}
    </main>
  );
}

function Betal({ trip, payment }) {
  const router = useRouter();
  const { run, busy, error } = useRpc();
  const { setNotice } = useTrip();
  const to = nameOf(trip, payment.to_member);

  async function pay() {
    unlockAudio(); // i klikket, så tikket må spille, når svaret kommer
    const { ok } = await run(
      "pay",
      "pay_payment",
      { p_payment_id: payment.id },
      "Betalingen kunne ikke gennemføres."
    );
    if (ok) {
      play("tick");
      // Beskeden vises øverst på gør op (F07), når vi er tilbage.
      setNotice(`Du har betalt ${to} ${formatKr(payment.amount)}`);
      router.push("/status");
    }
  }

  return (
    <>
      <div className={styles.content}>
        <span className={`text-heading-md ${styles.avatar}`} aria-hidden="true">
          {to.slice(0, 2).toUpperCase()}
        </span>
        <h2 className="text-heading-sm">{to}</h2>
        <p className={`text-body-md ${styles.secondary}`}>Din del af {trip.name}</p>
        <p className={`text-display-lg ${styles.amount}`}>{formatKr(payment.amount)}</p>

        <div className={styles.from}>
          <span className="text-label-lg">Fra din Vipps</span>
          <span className={`text-body-sm ${styles.secondary}`}>Til {to}</span>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={styles.actions}>
        {payment.paid_at ? (
          <Link href="/status" className={`btn btn-primary ${styles.wide}`}>
            Betalt. Tilbage til gør op
          </Link>
        ) : (
          <button
            type="button"
            className={`btn ${styles.brand} ${styles.wide}`}
            disabled={busy !== null}
            onClick={pay}
          >
            {busy ? "Betaler …" : "Betal"}
          </button>
        )}
      </div>
    </>
  );
}
