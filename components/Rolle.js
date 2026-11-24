"use client";

import { useEffect } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { ease } from "@/lib/motion";
import { objectSrc } from "@/lib/categories";
import { TZ, formatKr } from "@/lib/format";
import { nameOf } from "@/lib/status";
import Bankdirektoren from "@/components/roller/Bankdirektoren";
import Proviantmesteren from "@/components/roller/Proviantmesteren";
import styles from "./Rolle.module.css";

// F14–F17 · Rollesiderne (prototype v19). Alle får deres egen side: navnet slår ned,
// tallet bag rollen tæller op, og de rigtige køb bag rollen lander som bevis.
// Hver rolle har sin egen farve, sit eget tal og sin egen lille scene (components/roller/).
// split: hvor navnet deles i to linjer. kr: tallet er et beløb (ellers et antal).
// Motif: rollens scene nederst på siden.
export const PAGES = {
  bankdirektoren: {
    theme: "orange",
    split: 4,
    label: "Lagt ud",
    kr: true,
    caption: "lagt ud, mest af alle",
    Motif: Bankdirektoren,
  },
  natteravnen: {
    theme: "dark",
    split: 5,
    label: "Natkøb",
    caption: "køb mellem kl. 22 og 05",
  },
  proviantmesteren: {
    theme: "lilac",
    split: 8,
    label: "I alt",
    kr: true,
    caption: "brugt på indkøb",
    Motif: Proviantmesteren,
  },
  chaufforen: {
    theme: "peach",
    split: 5,
    label: "Taxameter",
    kr: true,
    caption: "brugt på transport",
  },
  kaffejunkien: {
    theme: "peach",
    split: 5,
    label: "Kaffer",
    caption: "kaffekøb, flest af alle",
  },
  snackfiend: {
    theme: "purple",
    split: 5,
    label: "Madkøb",
    caption: "madkøb, flest af alle",
  },
  skyldneren: {
    theme: "lilac",
    split: 5,
    label: "Skyldte",
    kr: true,
    caption: "skyldte mest, og betalte det hele",
    payments: true,
  },
  sneglen: {
    theme: "peach",
    split: 0,
    caption: "betalte som den sidste",
    payments: true,
  },
  passageren: {
    theme: "lilac",
    split: 5,
    label: "Lagt ud",
    kr: true,
    caption: "lagt ud på turen",
  },
};

const weekday = (iso) =>
  new Date(iso).toLocaleDateString("da-DK", { weekday: "long", timeZone: TZ });

// Tallet tæller op fra 0, når navnet er landet. Ved reduceret bevægelse står det der med det samme.
function CountUp({ value, kr, delay, instant }) {
  const count = useMotionValue(0);
  // Hele kroner, mens der tælles. Til sidst det præcise beløb (fx 452,22 kr.).
  const shown = useTransform(count, (v) => {
    if (!kr) return Math.round(v);
    return formatKr(v === value ? value : Math.round(v));
  });
  useEffect(() => {
    if (instant) return count.set(value);
    const counting = animate(count, value, { duration: 1.2, delay, ease: "easeOut" });
    return () => counting.stop();
  }, [count, value, delay, instant]);
  return <motion.b>{shown}</motion.b>;
}

export default function Rolle({ trip, result }) {
  const reduceMotion = useReducedMotion();
  const wait = (seconds) => (reduceMotion ? 0 : seconds);
  const { member, role, score, items } = result;
  const page = PAGES[role.id];
  const Motif = page.Motif;
  const lines = page.split
    ? [role.name.slice(0, page.split), role.name.slice(page.split)]
    : [role.name];

  // Beviset: de betalinger, personen sendte (Sneglen, Skyldneren), ellers de to dyreste køb.
  const proof = page.payments
    ? trip.payments
        .filter((p) => p.from_member === member.id)
        .map((p) => ({
          id: p.id,
          title: `Til ${nameOf(trip, p.to_member)}`,
          note: `${member.is_me ? "Du" : member.name} betalte`,
          amount: p.amount,
        }))
    : [...items]
        .sort((a, b) => b.amount - a.amount)
        .map((e) => ({
          id: e.id,
          title: e.title,
          note: `${weekday(e.purchased_at)}`,
          amount: e.amount,
          image: objectSrc(e.category),
        }));

  // Sneglen: hvor mange gange blev personen rykket?
  const nudges = trip.payments
    .filter((p) => p.from_member === member.id)
    .reduce((sum, p) => sum + (p.nudge_count ?? 0), 0);
  const caption =
    role.id === "sneglen" && nudges > 0
      ? `${page.caption} og blev rykket ${nudges} ${nudges === 1 ? "gang" : "gange"}`
      : page.caption;

  let letter = 0; // tæller bogstaverne på tværs af linjerne, så de falder ét ad gangen

  return (
    <div className={styles.scene} data-theme={page.theme}>
      <p className={styles.sticker}>{member.is_me ? "Du er" : `${member.name} er`}</p>

      <h2 className={styles.name} aria-label={role.name}>
        {lines.map((line) => (
          <span key={line} className={styles.line} aria-hidden="true">
            {[...line].map((char) => {
              letter += 1;
              return (
                <motion.span
                  key={letter}
                  initial={{ y: -80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: wait(0.2 + letter * 0.04), ease: ease.bump, duration: 0.4 }}
                >
                  {char}
                </motion.span>
              );
            })}
          </span>
        ))}
      </h2>

      {page.label && (
        <p className={styles.display}>
          <span>{page.label}</span>
          <CountUp value={score} kr={page.kr} delay={0.8} instant={reduceMotion} />
        </p>
      )}
      <p className={styles.caption}>{caption}</p>

      <ul className={styles.proof}>
        {proof.slice(0, 2).map((p, index) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: wait(1.4 + index * 0.25), ease: ease.bump }}
          >
            {p.image ? (
              <Image src={p.image} alt="" width={36} height={36} />
            ) : (
              <span className={styles.initials} aria-hidden="true">
                {p.title.slice(4, 6).toUpperCase()}
              </span>
            )}
            <span className={styles.what}>
              <b>{p.title}</b>
              <small>{p.note}</small>
            </span>
            <b>{formatKr(p.amount)}</b>
          </motion.li>
        ))}
      </ul>

      {/* Rollens egen lille scene nederst. Pynt: aria-hidden. */}
      <div className={styles.motif} aria-hidden="true">
        {Motif && <Motif trip={trip} result={result} />}
      </div>
    </div>
  );
}
