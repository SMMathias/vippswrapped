"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTrip } from "../trip-provider";
import { assignRoles, highlights } from "@/lib/wrapped";
import { bannerState, nameOf } from "@/lib/status";
import { objectSrc } from "@/lib/categories";
import { formatDateRange, formatKr } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { LockIcon } from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/states";
import { TableObjects } from "@/components/table-objects";
import { TopBar } from "@/components/top-bar";
import styles from "./page.module.css";

export default function WrappedPage() {
  const { trip, loading, error, reload } = useTrip();

  if (!trip && loading) {
    return (
      <main className={styles.plain}>
        <LoadingState label="Henter Wrapped …" />
      </main>
    );
  }
  if (!trip) {
    return (
      <main className={styles.plain}>
        <ErrorState message={error} onRetry={reload} />
      </main>
    );
  }
  // H2: Wrapped er låst, indtil alle har betalt.
  if (trip.status !== "settled") return <Locked trip={trip} />;
  return <Story trip={trip} />;
}

function Locked({ trip }) {
  const { text } = bannerState(trip);
  return (
    <main className={styles.plain}>
      <TopBar title="Wrapped" />
      <div className={styles.locked}>
        <span className={styles.lockCircle}>
          <LockIcon size={32} />
        </span>
        <h2 className="text-heading-md">Wrapped er låst</h2>
        <p className="text-body-md">{text}.</p>
        <Link
          href={trip.status === "settling" ? "/status" : "/"}
          className="btn btn-primary"
        >
          {trip.status === "settling" ? "Se status" : "Til turen"}
        </Link>
      </div>
    </main>
  );
}

// ---------- Kortene ----------

function buildCards(trip) {
  const h = highlights(trip);
  const roles = assignRoles(trip);
  // Dig sidst, så ens egen rolle er klimaks.
  const ordered = [...roles.filter((r) => !r.member.is_me), ...roles.filter((r) => r.member.is_me)];

  return [
    {
      key: "intro",
      theme: "purple",
      content: (
        <>
          <p className="text-label-lg">{formatDateRange(trip.startsOn, trip.endsOn)}</p>
          <h2 className="text-display-lg">{trip.name}</h2>
          <TableObjects expenses={trip.expenses} />
          <p className="text-label-lg">
            {trip.members.length} venner · {h.count} køb
          </p>
          <p className="text-display-lg">{formatKr(h.total)}</p>
          <p className="text-body-md">{formatKr(h.perPerson)} pr. person</p>
        </>
      ),
    },
    {
      key: "items",
      theme: "peach",
      content: (
        <>
          <h2 className="text-display-md">Det her købte I</h2>
          <ul className={styles.grid}>
            {trip.expenses.map((e) => (
              <li key={e.id} className={styles.gridItem}>
                <Image src={objectSrc(e.category)} alt="" width={88} height={88} />
                <span className="text-label-md">{e.title}</span>
                <span className="text-caption-md">
                  {formatKr(e.amount)} · {nameOf(trip, e.paid_by)}
                </span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      key: "highlights",
      theme: "orange",
      content: (
        <>
          <h2 className="text-display-md">Højdepunkter</h2>
          <ul className={styles.highlights}>
            {h.mostExpensive && (
              <Highlight
                label="Dyreste køb"
                title={h.mostExpensive.title}
                text={`${formatKr(h.mostExpensive.amount)} · ${nameOf(trip, h.mostExpensive.paid_by)}`}
                object={h.mostExpensive}
              />
            )}
            {h.popular && (
              <Highlight
                label="Mest populære kategori"
                title={h.popular.label}
                text={`${h.popular.count} af ${h.count} køb · ${formatKr(h.popular.total)}`}
                object={h.popular.object}
              />
            )}
          </ul>
        </>
      ),
    },
    ...ordered.map((r) => ({
      key: `role-${r.member.id}`,
      theme: "dark",
      content: <RoleReveal result={r} />,
    })),
    {
      key: "group",
      theme: "purple",
      content: (
        <>
          <h2 className="text-display-md">Turen i roller</h2>
          <ul className={styles.group}>
            {roles.map((r) => (
              <li key={r.member.id} className={styles.groupRow}>
                <Avatar name={r.member.name} />
                <span className={styles.groupText}>
                  <span className="text-label-lg">
                    {r.member.name} · {r.role.name}
                  </span>
                  <span className="text-body-sm">{r.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      ),
      end: true,
    },
  ];
}

function Highlight({ label, title, text, object }) {
  return (
    <li className={styles.highlight}>
      {object && <Image src={objectSrc(object.category)} alt="" width={64} height={64} />}
      <span className={styles.highlightText}>
        <span className="text-caption-md">{label.toUpperCase()}</span>
        <span className="text-heading-md">{title}</span>
        <span className="text-body-sm">{text}</span>
      </span>
    </li>
  );
}

// B17: rolle-reveal. Objektet, der "beviser" rollen, navnet og tallet bag.
function RoleReveal({ result }) {
  const { member, role, detail, object } = result;
  return (
    <div className={styles.role}>
      {object ? (
        <Image
          src={objectSrc(object.category)}
          alt=""
          width={200}
          height={200}
          className={styles.roleObject}
        />
      ) : (
        <span className={styles.roleAvatar} aria-hidden="true">
          {member.name.slice(0, 2).toUpperCase()}
        </span>
      )}
      <p className={`text-heading-sm ${styles.roleWho}`}>
        <Avatar name={member.name} />
        {member.is_me ? "Du er" : `${member.name} er`}
      </p>
      <h2 className={`text-display-lg ${styles.roleName}`}>{role.name}</h2>
      <p className="text-label-lg">{detail}</p>
    </div>
  );
}

// ---------- Navigation: tryk, swipe og piletaster ----------

function Story({ trip }) {
  const router = useRouter();
  const cards = buildCards(trip);
  const last = cards.length - 1;
  const [index, setIndex] = useState(0);
  const pointerStart = useRef(null);
  const swiped = useRef(false);

  const go = (delta) => setIndex((i) => Math.min(last, Math.max(0, i + delta)));

  // Piletaster, Home/End og Escape. Ingen automatisk afspilning, så der er intet at pause.
  // Taster med Ctrl/Alt/Cmd ignoreres, så browserens egne genveje (fx Alt+← = tilbage) virker.
  useEffect(() => {
    function onKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") setIndex((i) => Math.min(last, i + 1));
      else if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else if (event.key === "Home") setIndex(0);
      else if (event.key === "End") setIndex(last);
      else if (event.key === "Escape") router.push("/");
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, router]);

  // Swipe: mere end 50 px vandret tæller som et swipe og ikke et tryk.
  function onPointerDown(event) {
    pointerStart.current = event.clientX;
    swiped.current = false;
  }
  function onPointerUp(event) {
    if (pointerStart.current === null) return;
    const dx = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) > 50) {
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
    }
  }
  // Et swipe må ikke også tælle som et tryk på en af tap-zonerne.
  function tap(delta) {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    go(delta);
  }

  const card = cards[index];

  return (
    <main
      className={`${styles.story} ${styles[card.theme]}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Fremdrift som i B14. Pynt: teksten "Kort x af y" står i kortets label. */}
      <div className={styles.progress} aria-hidden="true">
        {cards.map((c, i) => (
          <span key={c.key} className={i <= index ? styles.progressDone : ""} />
        ))}
      </div>

      <div className={styles.bar}>
        <span className="text-label-md">{trip.name}</span>
        <Link href="/" className={`text-label-lg ${styles.close}`}>
          Luk
        </Link>
      </div>

      {/* Tap-zoner: venstre halvdel tilbage, højre halvdel frem (som stories). */}
      {/* aria-disabled i stedet for disabled: en knap med disabled mister fokus,
          så tastaturbrugere ville "falde ud" på første og sidste kort. */}
      <button
        type="button"
        className={styles.prev}
        onClick={() => tap(-1)}
        aria-disabled={index === 0}
      >
        <span className="visually-hidden">Forrige kort</span>
      </button>
      <button
        type="button"
        className={styles.next}
        onClick={() => tap(1)}
        aria-disabled={index === last}
      >
        <span className="visually-hidden">Næste kort</span>
      </button>

      {/* key: kortet bygges forfra ved hvert skift, så animationen kører igen. */}
      <section
        key={card.key}
        className={styles.card}
        aria-roledescription="kort"
        aria-label={`Kort ${index + 1} af ${cards.length}`}
        aria-live="polite"
      >
        {card.content}

        {index === 0 && (
          <p className={`text-caption-md ${styles.hint}`}>Tryk, swipe eller brug piletasterne</p>
        )}

        {card.end && (
          <div className={styles.endActions}>
            <button type="button" className="btn btn-secondary" onClick={() => setIndex(0)}>
              Se igen
            </button>
            <Link href="/" className={`btn ${styles.endPrimary}`}>
              Til turen
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
