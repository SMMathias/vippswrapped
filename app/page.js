"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTrip } from "./trip-provider";
import { Avatar } from "@/components/avatar";
import { DemoControls } from "@/components/demo-controls";
import { SoundToggle } from "@/components/sound-toggle";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import { TableObjects } from "@/components/table-objects";
import { WrappedBanner } from "@/components/wrapped-banner";
import { formatDateRange, formatDateTime, formatKr } from "@/lib/format";
import { owedHeading, tripTotal } from "@/lib/status";
import { playOnce } from "@/lib/feedback";
import styles from "./page.module.css";

// Tingen rammer bordet ca. midt i animationen (--motion-duration-slower er 500 ms).
const LANDING_DELAY_MS = 250;

export default function GroupPage() {
  const { trip, loading, error, reload, lastAddedId } = useTrip();

  // Blødt bump, når den nye udgift lander på bordet (H1). Spilles midt i
  // landings-animationen og kun én gang pr. udgift. Teksten "… ligger nu på
  // bordet" nedenfor bærer informationen, så lyden er kun ekstra.
  const landedId = trip?.expenses.some((e) => e.id === lastAddedId) ? lastAddedId : null;
  useEffect(() => {
    if (!landedId) return;
    const timer = setTimeout(() => playOnce(`landed-${landedId}`, "bump"), LANDING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [landedId]);

  // UI states: første gang er der ingen data endnu.
  if (!trip && loading) return <LoadingState />;
  if (!trip) return <ErrorState message={error} onRetry={reload} />;

  const nameOf = (memberId) =>
    trip.members.find((m) => m.id === memberId)?.name ?? "Ukendt";

  // Udgiften, der lige er delt fra "Tilføj udgift" (hvis der er en).
  const added = trip.expenses.find((e) => e.id === lastAddedId);

  // Mit eget beløb står stort øverst (test runde 2, TP3).
  const myOutstanding =
    trip.balances.find((b) => b.member.id === trip.me?.id)?.outstanding ?? 0;

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className="text-heading-lg">{trip.name}</h1>
          <p className={`text-body-md ${styles.secondary}`}>
            {formatDateRange(trip.startsOn, trip.endsOn)} · {trip.members.length} personer
          </p>
        </div>
        <SoundToggle />
      </header>

      <WrappedBanner trip={trip} />

      {/* Bordet (prototype v19, F01): turens ting som 3D-objekter. Kun den nye ting lander.
          Når turen er gjort op, er bordet ryddet: tingene ligger nu i Wrapped (F09b). */}
      <section aria-labelledby="table-heading" className={styles.tableCard}>
        <p className={styles.tableHead}>
          <span id="table-heading" className="text-label-md">
            Bordet
          </span>
          <span className="text-label-md">
            {trip.status === "settled"
              ? "Ryddet"
              : `${trip.expenses.length} køb, ${formatKr(tripTotal(trip))}`}
          </span>
        </p>
        {trip.status === "settled" ? (
          <p className={`text-body-md ${styles.cleared}`}>Tingene ligger nu i jeres Wrapped.</p>
        ) : (
          <TableObjects expenses={trip.expenses} newId={lastAddedId} />
        )}
      </section>

      {/* Fejl ved genindlæsning: de gamle data bliver stående, og fejlen vises over dem. */}
      {error && (
        <p className={styles.inlineError} role="alert">
          {error}
        </p>
      )}

      {/* Bekræftelse i tekst, så den ikke kun afhænger af animationen. */}
      {added && (
        <p className={styles.confirmation} role="status">
          {added.title} er delt med {added.shares.length} personer og ligger nu på bordet.
        </p>
      )}

      {/* Dit eget beløb stort, og vejen til status og opgørelse. */}
      <section aria-labelledby="owe-heading" className={styles.oweCard}>
        <h2 id="owe-heading" className="text-label-md">
          {owedHeading(trip.status, myOutstanding)}
        </h2>
        <p className={`text-display-md ${myOutstanding < 0 ? styles.negative : ""}`}>
          {formatKr(Math.abs(myOutstanding))}
        </p>
        <Link href="/status" className={styles.statusLink}>
          <span className="text-label-lg">Status og opgørelse</span>
          <span aria-hidden="true" className={styles.chevron}>
            ›
          </span>
        </Link>
      </section>

      <section aria-labelledby="balances-heading" className={styles.section}>
        <h2 id="balances-heading" className="text-heading-sm">
          Hvem skylder hvem
        </h2>
        <ul className={styles.list}>
          {trip.balances.map(({ member, outstanding }) => (
            <li key={member.id} className={styles.row}>
              <Avatar name={member.name} />
              <span className={`text-label-lg ${styles.grow}`}>{member.name}</span>
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
              <li
                key={expense.id}
                className={`${styles.row} ${expense.id === lastAddedId ? styles.landed : ""}`}
              >
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

      <DemoControls />

      {/* Som i B01: "Tilføj udgift" i bunden, mens turen er i gang. */}
      {trip.status === "open" && (
        <div className={styles.actions}>
          <Link href="/tilfoej" className={`btn btn-primary ${styles.addButton}`}>
            <span className={styles.plus} aria-hidden="true">
              +
            </span>
            Tilføj udgift
          </Link>
        </div>
      )}

      {/* Under opgørelsen er næste skridt at gøre op. */}
      {trip.status === "settling" && (
        <div className={styles.actions}>
          <Link href="/status" className={`btn btn-primary ${styles.addButton}`}>
            Gør op
          </Link>
        </div>
      )}
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
