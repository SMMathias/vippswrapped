"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTrip } from "../trip-provider";
import { assignRoles, highlights } from "@/lib/wrapped";
import { bannerState, nameOf } from "@/lib/status";
import { objectSrc } from "@/lib/categories";
import { formatKr } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import DagForDag from "@/components/DagForDag";
import Historie from "@/components/Historie";
import Kvittering from "@/components/Kvittering";
import { LockIcon } from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/states";
import { TopBar } from "@/components/top-bar";
import Oplaasning from "@/components/Oplaasning";
import styles from "./page.module.css";

export default function WrappedPage() {
  const { trip, loading, error, reload } = useTrip();
  // F09 kommer først. "Se Wrapped" (eller "Spring over" og så "Se Wrapped") åbner kortene.
  const [opened, setOpened] = useState(false);

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
  if (!opened) return <Oplaasning trip={trip} onDone={() => setOpened(true)} />;
  return <Historie cards={buildCards(trip)} title={trip.name} />;
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
      // F11 · Bonen (prototype v19): turens kvittering skrives, mens tingene lander.
      key: "bon",
      theme: "receipt",
      content: <Kvittering trip={trip} total={h.total} perPerson={h.perPerson} />,
    },
    {
      // F12 · Turen dag for dag: kurven over, hvad I brugte hver dag.
      key: "dage",
      theme: "peach",
      content: <DagForDag trip={trip} total={h.total} />,
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
