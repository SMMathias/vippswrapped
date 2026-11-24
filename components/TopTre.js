"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import { objectSrc } from "@/lib/categories";
import { TZ, formatKr } from "@/lib/format";
import { nameOf } from "@/lib/status";
import styles from "./TopTre.module.css";

// F13 · Jeres 3 dyreste køb (prototype v19). Bonen fra F11 kommer igen, og en lup
// finder nummer 3, 2 og 1. Til sidst forsvinder bonen, og de tre bliver til en liste.
// Samme trin-mønster som oplåsningen: hvert trin har sin ventetid i ms.
const steps = [
  { name: "scan", wait: 900 },
  { name: "find3", wait: 1300 },
  { name: "find2", wait: 1300 },
  { name: "find1", wait: 1500 },
  { name: "list" },
];
const last = steps.length - 1;
const rowHeight = 44; // px pr. linje på bonen
const maxLines = 7;

const weekday = (iso) =>
  new Date(iso).toLocaleDateString("da-DK", { weekday: "long", timeZone: TZ });

export default function TopTre({ trip }) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const found = Math.min(step, 3); // hvor mange af de tre luppen har fundet

  // De tre dyreste: nummer 1 først.
  const top = [...trip.expenses].sort((a, b) => b.amount - a.amount).slice(0, 3);
  // Bonen: de tre dyreste og de første andre køb, i den rækkefølge de blev købt.
  const others = trip.expenses.filter((e) => !top.includes(e)).slice(0, maxLines - top.length);
  const lines = [...top, ...others].sort(
    (a, b) => new Date(a.purchased_at) - new Date(b.purchased_at),
  );
  // Luppen leder efter nummer 3 først, så nummer 2 og til sidst nummer 1.
  const target = found > 0 && step < last ? top[3 - found] : null;
  // Er linjen en af dem, luppen allerede har fundet? (nummer 3 findes først)
  const isFound = (e) => top.includes(e) && top.indexOf(e) >= 3 - found;

  useEffect(() => {
    if (step === last) return;
    const timer = setTimeout(
      () => setStep(reduceMotion ? last : step + 1),
      reduceMotion ? 0 : steps[step].wait,
    );
    return () => clearTimeout(timer);
  }, [step, reduceMotion]);

  return (
    <div className={styles.scene}>
      <p className={styles.sticker}>Jeres 3 dyreste køb</p>

      {step < last ? (
        <>
          {/* Tre pladser øverst: de fyldes, efterhånden som luppen finder dem. */}
          <ol className={styles.slots}>
            {[3, 2, 1].map((rank) => {
              const e = found >= 4 - rank ? top[rank - 1] : null;
              return (
                <li key={rank} className={e ? styles.filled : ""}>
                  {e ? (
                    <motion.span
                      className={styles.slot}
                      initial={{ scale: 1.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ ease: ease.bump }}
                    >
                      <b>{rank}</b>
                      <Image src={objectSrc(e.category)} alt="" width={36} height={36} />
                      {formatKr(e.amount)}
                    </motion.span>
                  ) : (
                    <b>{rank}</b>
                  )}
                </li>
              );
            })}
          </ol>

          <div className={styles.receipt}>
            <p className={styles.head}>Alle køb</p>
            <div className={styles.rows}>
              <ul className={styles.lines}>
                {lines.map((e) => (
                  <li key={e.id} className={isFound(e) ? styles.marked : ""}>
                    <Image src={objectSrc(e.category)} alt="" width={28} height={28} />
                    <span>
                      {e.title}
                      <small>
                        {nameOf(trip, e.paid_by)}, {weekday(e.purchased_at)}
                      </small>
                    </span>
                    <b>{formatKr(e.amount)}</b>
                  </li>
                ))}
              </ul>
              {/* Luppen glider hen over den linje, den leder efter. */}
              <motion.div
                className={styles.lens}
                aria-hidden="true"
                initial={{ y: -40, opacity: 0 }}
                animate={{
                  y: target ? lines.indexOf(target) * rowHeight : 0,
                  opacity: target ? 1 : 0,
                }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
              />
            </div>
          </div>
        </>
      ) : (
        <ol className={styles.list}>
          {top.map((e, index) => (
            <motion.li
              key={e.id}
              className={styles[`rank${index + 1}`]}
              initial={{ opacity: 0, y: 60, rotate: index % 2 ? 4 : -4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{
                delay: reduceMotion ? 0 : index * 0.15,
                ease: ease.bump,
                duration: 0.5,
              }}
            >
              <b className={styles.number}>{index + 1}</b>
              <span className={styles.text}>
                <b>{e.title}</b>
                <small>
                  {nameOf(trip, e.paid_by)}, {weekday(e.purchased_at)}
                </small>
                <strong>{formatKr(e.amount)}</strong>
              </span>
              <Image src={objectSrc(e.category)} alt="" width={72} height={72} />
            </motion.li>
          ))}
        </ol>
      )}
    </div>
  );
}
