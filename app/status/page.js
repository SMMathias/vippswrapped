"use client";

import { useState } from "react";
import Link from "next/link";
import { useTrip } from "../trip-provider";
import { useRpc } from "../use-rpc";
import { useNow } from "../use-now";
import { TRIP_SLUG } from "@/lib/supabase";
import { canNudge, nameOf, owedHeading, tripTotal, waitingNames } from "@/lib/status";
import { formatKr } from "@/lib/format";
import { play, unlockAudio } from "@/lib/feedback";
import { Avatar } from "@/components/avatar";
import { CheckIcon, LockIcon } from "@/components/icons";
import { DemoControls } from "@/components/demo-controls";
import { ErrorState, LoadingState } from "@/components/states";
import { TableObjects } from "@/components/table-objects";
import { TopBar } from "@/components/top-bar";
import styles from "./page.module.css";

// Ryk kan bruges igen efter 30 sek. i demoen (Wrapped-regler 5).
const NUDGE_COOLDOWN_MS = 30_000;

// Status og gør op (B09 → B10 → B12 → B13).
export default function StatusPage() {
  const { trip, loading, error, reload } = useTrip();

  return (
    <main className={styles.page}>
      <TopBar title="Status" />
      {!trip && loading && <LoadingState />}
      {!trip && !loading && <ErrorState message={error} onRetry={reload} />}
      {trip && <Status trip={trip} />}
    </main>
  );
}

function Status({ trip }) {
  const { run, busy, error } = useRpc();
  const now = useNow(5000);
  const [toast, setToast] = useState("");

  const me = trip.me;
  const myOutstanding = trip.balances.find((b) => b.member.id === me?.id)?.outstanding ?? 0;
  const myPayments = trip.payments.filter((p) => p.from_member === me?.id);
  const paymentsToMe = trip.payments.filter((p) => p.to_member === me?.id);

  async function pay(p) {
    unlockAudio(); // i klikket, så tikket må spille, når svaret kommer
    const { ok } = await run(
      p.id,
      "pay_payment",
      { p_payment_id: p.id },
      "Betalingen kunne ikke gennemføres."
    );
    // Let tik, når betalingen er gået igennem: et skridt tættere på Wrapped (H2).
    // "Betalt" med flueben står som tekst, så tikket er kun ekstra.
    if (ok) play("tick");
  }

  async function nudge(p) {
    const { ok } = await run(
      `nudge-${p.id}`,
      "nudge_payment",
      { p_payment_id: p.id },
      "Rykket kunne ikke sendes."
    );
    if (ok) {
      // Der er intet login, så beskeden vises her i stedet for hos Oliver.
      setToast(`${nameOf(trip, p.from_member)} har fået et ryk: "Wrapped venter kun på dig 👀"`);
      setTimeout(() => setToast(""), 5000);
    }
  }

  return (
    <div className={styles.content}>
      {/* B09: hvad skal jeg betale, og hvad har turen kostet.
          Test runde 2 (TP3): overskriften siger nu, om beløbet er en saldo
          (turen er i gang) eller det, du skal betale (efter opgørelsen). */}
      <section className={styles.summary} aria-labelledby="summary-heading">
        <h2 id="summary-heading" className="text-body-md">
          {owedHeading(trip.status, myOutstanding)}
        </h2>
        <p className="text-display-md">{formatKr(Math.abs(myOutstanding))}</p>
        <dl className={styles.totalRow}>
          <dt className="text-label-md">Udgifter i alt</dt>
          <dd className="text-label-md">{formatKr(tripTotal(trip))}</dd>
        </dl>
      </section>

      {trip.status === "open" ? (
        <OpenState trip={trip} run={run} busy={busy} />
      ) : (
        <>
          {myPayments.length > 0 && (
            <section className={styles.section} aria-labelledby="owe-heading">
              <h2 id="owe-heading" className="text-label-lg">
                Du skylder dem
              </h2>
              <ul className={styles.cardList}>
                {myPayments.map((p) => {
                  const to = nameOf(trip, p.to_member);
                  return (
                    <li key={p.id} className={styles.payRow}>
                      <Avatar name={to} />
                      <span className={styles.grow}>
                        <span className="text-label-lg">{to}</span>
                        <span className={`text-body-sm ${styles.secondary}`}>
                          {formatKr(p.amount)}
                        </span>
                      </span>
                      {p.paid_at ? (
                        <span className={`text-label-md ${styles.paid}`}>
                          <CheckIcon /> Betalt
                        </span>
                      ) : (
                        <button
                          type="button"
                          className={`btn btn-primary ${styles.smallBtn}`}
                          disabled={busy !== null}
                          onClick={() => pay(p)}
                        >
                          {busy === p.id ? "Betaler …" : "Betal"}
                          <span className="visually-hidden">
                            {" "}
                            {formatKr(p.amount)} til {to}
                          </span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {paymentsToMe.length > 0 && (
            <section className={styles.section} aria-labelledby="get-heading">
              <h2 id="get-heading" className="text-label-lg">
                Du får fra
              </h2>
              <ul className={styles.cardList}>
                {paymentsToMe.map((p) => {
                  const from = nameOf(trip, p.from_member);
                  return (
                    <li key={p.id} className={styles.payRow}>
                      <Avatar name={from} />
                      <span className={styles.grow}>
                        <span className="text-label-lg">{from}</span>
                        <span className={`text-body-sm ${styles.secondary}`}>
                          {formatKr(p.amount)}
                        </span>
                      </span>
                      <PaymentStatus paid={Boolean(p.paid_at)} />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Vipps forklarer, hvorfor man ikke betaler alle (B10). */}
          <details className={styles.explain}>
            <summary className="text-label-md">
              Hvorfor skal jeg ikke betale alle, der har betalt for mig?
            </summary>
            <p className="text-body-md">
              Gælden er samlet, så I gør op med færrest mulige overførsler. Du betaler kun det, der
              står ovenfor, selv om flere har lagt ud for dig. Til sidst står alle i 0 kr.
            </p>
          </details>

          <WrappedCard
            trip={trip}
            now={now}
            busy={busy}
            onNudge={nudge}
          />
        </>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {/* Altid i DOM'en, så skærmlæsere opdager, når der kommer tekst i den. */}
      <p className={`text-label-md ${styles.toast}`} role="status">
        {toast}
      </p>

      <DemoControls />
    </div>
  );
}

// B09: før opgørelsen. Hvem skylder hvem som bjælker + "Afslut og beregn".
function OpenState({ trip, run, busy }) {
  const rows = [...trip.balances].sort((a, b) => b.outstanding - a.outstanding);
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.outstanding)));

  return (
    <>
      <section className={styles.section} aria-labelledby="who-heading">
        <h2 id="who-heading" className="text-label-lg">
          Hvem skylder hvem
        </h2>
        <ul className={styles.bars}>
          {rows.map(({ member, outstanding }) => {
            const width = `${(Math.abs(outstanding) / max) * 100}%`;
            return (
              <li key={member.id} className={styles.barRow}>
                <Avatar name={member.name} />
                <span className={`text-label-md ${styles.barName}`}>{member.name}</span>
                {/* Bjælken er pynt. Beløbet står som tekst ved siden af. */}
                <span className={styles.barTrack} aria-hidden="true">
                  <span className={styles.barHalf}>
                    {outstanding < 0 && <span className={styles.barNeg} style={{ width }} />}
                  </span>
                  <span className={styles.barHalf}>
                    {outstanding > 0 && <span className={styles.barPos} style={{ width }} />}
                  </span>
                </span>
                {/* Test runde 2: "skylder"/"får" i ord, så fortegnet ikke kan misforstås. */}
                <span
                  className={`text-label-md ${styles.barAmount} ${
                    outstanding < 0 ? styles.negative : outstanding > 0 ? styles.positive : ""
                  }`}
                >
                  {outstanding < 0
                    ? `Skylder ${formatKr(-outstanding)}`
                    : outstanding > 0
                      ? `Får ${formatKr(outstanding)}`
                      : "Gjort op"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.close} aria-labelledby="close-heading">
        <h2 id="close-heading" className="text-heading-sm">
          Er alle færdige med at tilføje udgifter?
        </h2>
        <p className={`text-body-md ${styles.secondary}`}>
          Saldoerne ovenfor er, hvad hver person samlet skylder eller får. Når I afslutter, bliver de
          lavet om til så få overførsler som muligt, så du kan se præcis, hvem du skal betale.
        </p>
        <p className={`text-body-md ${styles.secondary}`}>
          Derefter kan der ikke tilføjes flere udgifter. Wrapped åbner, når alle har betalt.
        </p>
        <button
          type="button"
          className={`btn btn-primary ${styles.wide}`}
          disabled={busy !== null || trip.expenses.length === 0}
          onClick={() =>
            run("close", "close_trip", { p_trip_slug: TRIP_SLUG }, "Opgørelsen kunne ikke laves.")
          }
        >
          {busy === "close" ? "Beregner …" : "Afslut og beregn"}
        </button>
      </section>
    </>
  );
}

// B10/B12/B13: det låste (eller åbne) Wrapped-kort med alle overførsler.
function WrappedCard({ trip, now, busy, onNudge }) {
  const settled = trip.status === "settled";
  const nudgeAllowed = canNudge(trip);

  // Som B10 → B12: før første betaling en generel tekst, derefter hvem der mangler.
  const anyPaid = trip.payments.some((p) => p.paid_at);
  let subtitle;
  if (settled) subtitle = `${trip.expenses.length} køb · ${trip.members.length} roller`;
  else if (!anyPaid) subtitle = "Den åbner, når alle har betalt.";
  else subtitle = `Den åbner, når ${waitingNames(trip)} har betalt.`;

  return (
    <section
      className={`${styles.wrappedCard} ${settled ? styles.wrappedOpen : ""}`}
      aria-labelledby="wrapped-heading"
    >
      <div className={styles.table}>
        {/* Bordet er sløret, indtil Wrapped er åben: man kan ane tingene (silhuet). */}
        <div className={`${styles.tableInner} ${settled ? "" : styles.blurred}`}>
          <TableObjects expenses={trip.expenses} />
        </div>
        {!settled && (
          <span className={styles.lock}>
            <LockIcon />
          </span>
        )}
      </div>

      <div aria-live="polite">
        <h2 id="wrapped-heading" className="text-heading-sm">
          {settled ? "Jeres Wrapped er åben" : "Jeres Wrapped er klar"}
        </h2>
        <p className="text-body-md">{subtitle}</p>
      </div>

      {settled && (
        <Link href="/wrapped" className={`btn ${styles.wrappedBtn}`}>
          Se Wrapped
        </Link>
      )}

      <ul className={styles.transfers}>
        {trip.payments.map((p) => {
          const from = nameOf(trip, p.from_member);
          const to = nameOf(trip, p.to_member);
          const isMine = p.from_member === trip.me?.id;
          const cooling =
            p.nudged_at && now - new Date(p.nudged_at).getTime() < NUDGE_COOLDOWN_MS;
          const showNudge = !p.paid_at && !isMine && nudgeAllowed;

          return (
            <li key={p.id} className={styles.transfer}>
              <span className={styles.grow}>
                <span className="text-body-md">
                  {from} → {to} · {formatKr(p.amount)}
                </span>
                {p.nudge_count > 0 && !p.paid_at && (
                  <span className="text-caption-md">
                    Rykket {p.nudge_count} {p.nudge_count === 1 ? "gang" : "gange"}
                  </span>
                )}
              </span>
              {showNudge ? (
                <button
                  type="button"
                  className={`btn btn-secondary ${styles.nudge}`}
                  disabled={busy !== null || cooling}
                  onClick={() => onNudge(p)}
                >
                  {cooling ? "Rykket" : "Ryk"}
                  <span className="visually-hidden">
                    {" "}
                    {from} for {formatKr(p.amount)}
                  </span>
                </button>
              ) : (
                <PaymentStatus paid={Boolean(p.paid_at)} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PaymentStatus({ paid }) {
  return paid ? (
    <span className={`text-label-md ${styles.paid}`}>
      <CheckIcon /> Betalt
    </span>
  ) : (
    <span className="text-label-md">Mangler</span>
  );
}
