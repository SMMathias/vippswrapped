"use client";

import Image from "next/image";
import { useTrip } from "./trip-provider";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { formatDateRange, formatDateTime, formatKr } from "@/lib/format";
import styles from "./page.module.css";

export default function GroupPage() {
  const { trip, loading, error, reload } = useTrip();

  // UI states: første gang er der ingen data endnu.
  if (!trip && loading) return <LoadingState />;
  if (!trip) return <ErrorState message={error} onRetry={reload} />;

  const nameOf = (memberId) =>
    trip.members.find((m) => m.id === memberId)?.name ?? "Ukendt";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className="text-heading-lg">{trip.name}</h1>
        <p className={`text-body-md ${styles.secondary}`}>
          {formatDateRange(trip.startsOn, trip.endsOn)} · {trip.members.length} personer
        </p>
      </header>

      {/* Fejl ved genindlæsning: de gamle data bliver stående, og fejlen vises over dem. */}
      {error && (
        <p className={styles.inlineError} role="alert">
          {error}
        </p>
      )}

      <section aria-labelledby="balances-heading" className={styles.section}>
        <h2 id="balances-heading" className="text-heading-sm">
          Hvem skylder hvem
        </h2>
        <ul className={styles.list}>
          {trip.balances.map(({ member, outstanding }) => (
            <li key={member.id} className={styles.row}>
              <span className={styles.avatar} aria-hidden="true">
                {member.name[0]}
              </span>
              <span className="text-label-lg">{member.name}</span>
              <BalanceText amount={outstanding} isMe={member.is_me} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="expenses-heading" className={styles.section}>
        <h2 id="expenses-heading" className="text-heading-sm">
          Udgifter
        </h2>
        {trip.expenses.length === 0 ? (
          <EmptyState title="Ingen udgifter endnu">
            Når nogen lægger ud, lander tingen her.
          </EmptyState>
        ) : (
          <ul className={styles.list}>
            {trip.expenses.map((expense) => (
              <li key={expense.id} className={styles.row}>
                {/* Objektet er pynt: navnet står ved siden af, så alt er tom. */}
                <Image
                  src={`/3d/${expense.category.image}`}
                  alt=""
                  width={56}
                  height={56}
                  className={styles.object}
                />
                <span className={styles.rowText}>
                  <span className="text-label-lg">{expense.title}</span>
                  <span className={`text-body-sm ${styles.secondary}`}>
                    {nameOf(expense.paid_by)} lagde ud · {formatDateTime(expense.purchased_at)}
                  </span>
                </span>
                <span className="text-label-lg">{formatKr(expense.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// Teksten bærer informationen (ikke kun farven), og "skylder" er lilla som i Vipps.
function BalanceText({ amount, isMe }) {
  if (amount < 0) {
    return (
      <span className={`text-label-md ${styles.negative}`}>
        {isMe ? "Du skylder" : "Skylder"} {formatKr(-amount)}
      </span>
    );
  }
  if (amount > 0) {
    return (
      <span className={`text-label-md ${styles.positive}`}>
        {isMe ? "Du får" : "Får"} {formatKr(amount)}
      </span>
    );
  }
  return <span className={`text-label-md ${styles.secondary}`}>Gjort op</span>;
}
