"use client";

import { useState } from "react";
import Link from "next/link";
import { useTrip } from "../trip-provider";
import { assignRoles, highlights } from "@/lib/wrapped";
import { bannerState } from "@/lib/status";
import DagForDag from "@/components/DagForDag";
import Fotoboks from "@/components/Fotoboks";
import Historie from "@/components/Historie";
import Kvittering from "@/components/Kvittering";
import { LockIcon } from "@/components/icons";
import { ErrorState, LoadingState } from "@/components/states";
import { TopBar } from "@/components/top-bar";
import Oplaasning from "@/components/Oplaasning";
import Rolle, { PAGES } from "@/components/Rolle";
import TopKategorier from "@/components/TopKategorier";
import TopTre from "@/components/TopTre";
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
      // F12b · Top kategorier: tårne af klodser, ét pr. køb.
      key: "kategorier",
      theme: "orange",
      content: <TopKategorier trip={trip} total={h.total} />,
    },
    {
      // F13 · Jeres 3 dyreste køb: luppen over bonen fra F11.
      key: "top3",
      theme: "lilac",
      content: <TopTre trip={trip} />,
    },
    // F14–F17 · Alle får deres egen rolleside. Dig til sidst, så din rolle er klimaks.
    ...ordered.map((r) => ({
      key: `role-${r.member.id}`,
      theme: PAGES[r.role.id].theme,
      content: <Rolle trip={trip} result={r} />,
    })),
    {
      // F18 · Holdet i fotoboksen: én person ad gangen, og til sidst printes strimlen.
      key: "holdet",
      theme: "lilac",
      content: <Fotoboks trip={trip} results={ordered} />,
      end: true,
    },
  ];
}
