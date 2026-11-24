"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTrip } from "../trip-provider";
import { useRpc } from "../use-rpc";
import { useNow } from "../use-now";
import { TRIP_SLUG } from "@/lib/supabase";
import { canNudge, nameOf, owedHeading, tripTotal, waitingFor, waitingNames } from "@/lib/status";
import { formatKr } from "@/lib/format";
import { play, unlockAudio } from "@/lib/feedback";
import { Avatar } from "@/components/avatar";
import { CheckIcon } from "@/components/icons";
import { DemoControls } from "@/components/demo-controls";
import { ErrorState, LoadingState } from "@/components/states";
import { TopBar } from "@/components/top-bar";
import styles from "./page.module.css";

// Ryk kan bruges igen efter 30 sek. i demoen (Wrapped-regler 5).
const NUDGE_COOLDOWN_MS = 30_000;

// Status og gør op (B09 → B10 → B12 → B13).
export default function StatusPage() {
  const { trip, loading, error, reload } = useTrip();

  return (
    <main className={styles.page}>
      {/* Efter "Afslut og beregn" hedder skærmen "Gør op" (prototype v19, F05). */}
      <TopBar title={!trip || trip.status === "open" ? "Status" : "Gør op"} />
      {!trip && loading && <LoadingState />}
      {!trip && !loading && <ErrorState message={error} onRetry={reload} />}
      {trip && <Status trip={trip} />}
    </main>
  );
}

function Status({ trip }) {
  const { run, busy, error } = useRpc();
  const { notice, setNotice } = useTrip();
  const now = useNow(5000);

  // Beskeden øverst forsvinder efter 5 sek.
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 5000);
    return () => clearTimeout(timer);
  }, [notice, setNotice]);

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
    if (ok) {
      play("tick");
      setNotice(`Du har betalt ${nameOf(trip, p.to_member)} ${formatKr(p.amount)}`);
    }
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
      const from = nameOf(trip, p.from_member);
      setNotice(`${from} har fået et ryk fra dig: "Wrapped venter kun på dig 👀"`);
    }
  }

  return (
    <div className={styles.content}>
      {/* Altid i DOM'en, så skærmlæsere opdager, når der kommer tekst i den. */}
      <p className={`text-label-md ${styles.notice}`} role="status">
        {notice && <CheckIcon />} {notice}
      </p>

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
                Du skylder
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

          <WrappedCard trip={trip} now={now} busy={busy} onNudge={nudge} />
        </>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <DemoControls />
    </div>
  );
}

// B09: før opgørelsen. Hvem skylder hvem som på turen (prototype v19, F04) + "Afslut og beregn".
function OpenState({ trip, run, busy }) {
  const rows = [...trip.balances].sort((a, b) => b.outstanding - a.outstanding);

  return (
    <>
      <section className={styles.section} aria-labelledby="who-heading">
        <h2 id="who-heading" className="text-label-lg">
          Hvem skylder hvem
        </h2>
        <ul className={styles.cardList}>
          {rows.map(({ member, outstanding }) => (
            <li key={member.id} className={styles.payRow}>
              <Avatar name={member.name} />
              <span className={`text-label-lg ${styles.grow}`}>{member.name}</span>
              {/* Test runde 2: "skylder"/"får" i ord, så fortegnet ikke kan misforstås. */}
              <span
                className={`text-label-md ${
                  outstanding < 0 ? styles.negative : outstanding > 0 ? styles.positive : ""
                }`}
              >
                {outstanding < 0
                  ? `${member.is_me ? "Du skylder" : "Skylder"} ${formatKr(-outstanding)}`
                  : outstanding > 0
                    ? `Får ${formatKr(outstanding)}`
                    : "Gjort op"}
              </span>
            </li>
          ))}
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

// B10/B12/B13: Wrapped-kortet. Prototype v19 (F05): avatarerne med flueben viser, hvem der
// er gjort op, så Wrapped og overblikket står samme sted (test runde 2, rød tråd).
function WrappedCard({ trip, now, busy, onNudge }) {
  const settled = trip.status === "settled";
  const nudgeAllowed = canNudge(trip);
  const waiting = waitingFor(trip).map((m) => m.id);
  const doneCount = trip.members.length - waiting.length;

  // Som B10 → B12: før første betaling en generel tekst, derefter hvem der mangler.
  const anyPaid = trip.payments.some((p) => p.paid_at);
  let subtitle;
  if (settled) subtitle = `${trip.expenses.length} køb · ${trip.members.length} roller`;
  else if (!anyPaid) subtitle = "Den åbner, når alle har betalt.";
  else subtitle = `Den åbner, når ${waitingNames(trip)} har betalt.`;

  return (
    <>
      <section
        className={`${styles.wrappedCard} ${settled ? styles.wrappedOpen : ""}`}
        aria-labelledby="wrapped-heading"
      >
        <div aria-live="polite">
          <h2 id="wrapped-heading" className="text-heading-sm">
            {settled ? "Jeres Wrapped er åben" : "Jeres Wrapped er klar"}
          </h2>
          <p className="text-body-md">{subtitle}</p>
          <p className="text-label-md">
            {doneCount} af {trip.members.length} er gjort op
          </p>
        </div>

        {/* Ét flueben pr. person, der er gjort op. Navnet står under, så det ikke kun er farve. */}
        <ul className={styles.people}>
          {trip.members.map((m) => (
            <li key={m.id}>
              <span className={styles.face}>
                <Avatar name={m.name} />
                {!waiting.includes(m.id) && (
                  <span className={styles.tick}>
                    <CheckIcon size={10} />
                  </span>
                )}
              </span>
              <span className="text-caption-md">{m.name}</span>
            </li>
          ))}
        </ul>

        {settled && (
          <Link href="/wrapped" className={`btn ${styles.wrappedBtn}`}>
            Se Wrapped
          </Link>
        )}
      </section>

      <section className={styles.section} aria-labelledby="transfers-heading">
        <h2 id="transfers-heading" className="text-label-lg">
          Status på betaling
        </h2>
        <ul className={styles.cardList}>
          {trip.payments.map((p) => {
            const from = nameOf(trip, p.from_member);
            const to = nameOf(trip, p.to_member);
            const isMine = p.from_member === trip.me?.id;
            const cooling =
              p.nudged_at && now - new Date(p.nudged_at).getTime() < NUDGE_COOLDOWN_MS;
            const showNudge = !p.paid_at && !isMine && nudgeAllowed;

            return (
              <li key={p.id} className={styles.payRow}>
                <span className={styles.grow}>
                  <span className="text-label-lg">
                    {from} → {to}
                  </span>
                  <span className={`text-body-sm ${styles.secondary}`}>
                    {formatKr(p.amount)}
                    {p.nudge_count > 0 &&
                      !p.paid_at &&
                      `, rykket ${p.nudge_count} ${p.nudge_count === 1 ? "gang" : "gange"}`}
                  </span>
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
    </>
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
