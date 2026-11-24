"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { ease } from "@/lib/motion";
import { objectSrc } from "@/lib/categories";
import { formatDateRange, formatKr } from "@/lib/format";
import { play } from "@/lib/feedback";
import styles from "./Samlet.module.css";

// F18b · Jeres Wrapped samlet (prototype v19). Et polaroid skydes ud og fremkaldes langsomt.
// Når billedet er færdigt, bliver det et holokort: det vipper efter fingeren, og folien glimter.
// Alle roller står på kortet. Over 5 personer står de i to kolonner.
const developTime = 4; // sekunder, før billedet er fremkaldt
const developStart = 0.9;

export default function Samlet({ trip, results, highlights }) {
  const reduceMotion = useReducedMotion();
  const [developed, setDeveloped] = useState(false);
  // Reduceret bevægelse: billedet er fremkaldt med det samme.
  const develop = reduceMotion
    ? { duration: 0 }
    : { delay: developStart, duration: developTime, ease: "easeIn" };

  // Fingerens plads på kortet, fra 0 til 1. Kortet vipper mod fingeren (fjedrende).
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-12, 12]), {
    stiffness: 120,
    damping: 14,
  });
  const rotateX = useSpring(useTransform(pointerY, [0, 1], [10, -10]), {
    stiffness: 120,
    damping: 14,
  });
  // Folien glider modsat fingeren, så glansen ser ud til at ligge i kortet.
  const foilX = useTransform(pointerX, (x) => `${100 - x * 100}%`);
  const foilY = useTransform(pointerY, (y) => `${100 - y * 100}%`);
  const foilPosition = useMotionTemplate`${foilX} ${foilY}`;

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setDeveloped(true);
        play("bump");
      },
      reduceMotion ? 0 : (developStart + developTime) * 1000,
    );
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  function tilt(event) {
    if (!developed || reduceMotion) return;
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - box.left) / box.width);
    pointerY.set((event.clientY - box.top) / box.height);
  }
  function reset() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  // Billedet: hver kategoris ting én gang, højst 6.
  const things = [...new Set(trip.expenses.map((e) => objectSrc(e.category)))].slice(0, 6);
  const top = [...trip.expenses].sort((a, b) => b.amount - a.amount).slice(0, 3);
  const wide = results.length > 5;

  return (
    <div className={styles.scene}>
      <motion.div
        className={styles.polaroid}
        data-wide={wide || undefined}
        initial={{ y: 700, rotate: 6 }}
        animate={{ y: 0, rotate: -2 }}
        transition={{ duration: 0.9, ease: ease.bump }}
        style={{ rotateX, rotateY, transformPerspective: 900 }}
        onPointerMove={tilt}
        onPointerLeave={reset}
      >
        <div className={styles.photo}>
          {/* Fremkaldelsen: billedet går fra mørkt, brunt og sløret til skarpt. */}
          <motion.div
            className={styles.picture}
            initial={{ filter: "sepia(0.9) saturate(0.3) brightness(0.55) blur(4px)" }}
            animate={{ filter: "sepia(0) saturate(1) brightness(1) blur(0px)" }}
            transition={develop}
          >
            <i className={styles.sun} />
            <ul className={styles.people}>
              {results.map((r) => (
                <li key={r.member.id}>{r.member.name.slice(0, 2).toUpperCase()}</li>
              ))}
            </ul>
            <i className={styles.table} />
            <ul className={styles.things}>
              {things.map((src) => (
                <li key={src}>
                  <Image src={src} alt="" width={48} height={48} />
                </li>
              ))}
            </ul>
            <span className={styles.tag}>Wrapped</span>
          </motion.div>
          <motion.i
            className={styles.dark}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={develop}
          />
        </div>

        <div className={styles.body}>
          <p className={styles.title}>{trip.name}</p>
          <p className={styles.dates}>
            {formatDateRange(trip.startsOn, trip.endsOn)}, {trip.members.length} personer
          </p>
          <dl className={styles.facts}>
            <div>
              <dt>Brugt i alt</dt>
              <dd className={styles.big}>{formatKr(highlights.total)}</dd>
            </div>
            <div>
              <dt>Top kategori</dt>
              <dd className={styles.big}>{highlights.popular?.label ?? "Andet"}</dd>
            </div>
            <div>
              <dt>Top 3 køb</dt>
              {top.map((e, index) => (
                <dd key={e.id}>
                  <b>{index + 1}</b> {e.title}
                </dd>
              ))}
            </div>
            <div className={styles.roles}>
              <dt>Roller</dt>
              {results.map((r) => (
                <dd key={r.member.id}>
                  {r.member.is_me ? "Dig" : r.member.name}: <b>{r.role.name}</b>
                </dd>
              ))}
            </div>
          </dl>
          <p className={styles.footer}>
            <span>✓ Gjort op</span>
            <span>Vipps Wrapped</span>
          </p>
        </div>

        {/* Holofolien: en regnbue, der kun ses, når billedet er fremkaldt. */}
        <motion.i
          className={styles.foil}
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: developed ? 1 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.8 }}
          style={{ backgroundPosition: foilPosition }}
        />
      </motion.div>

      {/* Ved reduceret bevægelse vipper kortet ikke, så der er intet at forklare. */}
      {!reduceMotion && (
        <motion.p
          className={styles.hint}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ delay: 1.2 }}
        >
          {developed ? "Før fingeren hen over kortet" : "Billedet fremkaldes …"}
        </motion.p>
      )}
    </div>
  );
}
