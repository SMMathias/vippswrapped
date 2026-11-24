"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import { formatKr } from "@/lib/format";
import { tripTotal } from "@/lib/status";
import styles from "./Slutskaerm.module.css";

// F09 · slutskærmen: "Jeres Wrapped er åben". Turens ting hvirvler ind og kredser
// om titlen, og alle i gruppen får et flueben, én ad gangen. "Se Wrapped" flyver
// gennem titlen, og en lilla cirkel vokser ud fra knappen og fører videre til bonen.
const radiusX = 165; // ringen er en flad ellipse, som en ring set lidt fra siden
const radiusY = 80;
const points = 24; // punkter pr. omgang
const roundTime = 14; // sekunder pr. omgang
const leaveTime = 700; // ms for overgangen til Wrapped-kortene

// Én omgang på ellipsen som keyframes. Ting forrest er større og ligger over titlen.
function orbitPath(start) {
  const path = { x: [], y: [], scale: [], zIndex: [] };
  for (let k = 0; k <= points; k++) {
    const angle = start + (k / points) * Math.PI * 2;
    const front = Math.sin(angle); // -1 bagerst, 1 forrest
    path.x.push(Math.cos(angle) * radiusX);
    path.y.push(front * radiusY);
    path.scale.push(0.8 + front * 0.3);
    path.zIndex.push(front > 0 ? 2 : 0);
  }
  return path;
}

export default function Slutskaerm({ trip, items, onDone }) {
  const goRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [leaving, setLeaving] = useState(false);

  // Reduceret bevægelse: alt står der med det samme, uden ventetid.
  const wait = (seconds) => (reduceMotion ? 0 : seconds);

  // Fokus på knappen, så tastatur og skærmlæser lander det rigtige sted.
  useEffect(() => {
    goRef.current?.focus();
  }, []);

  function go() {
    if (reduceMotion) return onDone();
    setLeaving(true);
    setTimeout(onDone, leaveTime);
  }

  return (
    <div className={styles.final}>
      <motion.p
        className={styles.sticker}
        initial={{ scale: 2.4, opacity: 0, rotate: -3 }}
        animate={{ scale: 1, opacity: 1, rotate: -3 }}
        transition={{ delay: wait(0.9), duration: 0.4, ease: ease.bump }}
      >
        Alle {trip.members.length} har betalt
      </motion.p>

      <motion.div
        className={styles.stage}
        initial={false}
        animate={leaving ? { scale: 2.4, opacity: 0, filter: "blur(8px)" } : { scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.5, 0, 0.9, 0.4] }}
      >
        <ul className={styles.orbit} aria-hidden="true">
          {items.map((src, index) => (
            <motion.li
              key={src}
              animate={orbitPath((index / items.length) * Math.PI * 2)}
              transition={{ duration: roundTime, repeat: Infinity, ease: "linear" }}
            >
              {/* Hvirvler ind fra midten, før den følger ringen. */}
              <motion.div
                initial={{ scale: 0, rotate: -120, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: wait(0.3 + index * 0.06), duration: 0.9, ease: ease.bump }}
              >
                <Image src={src} alt="" width={72} height={72} />
              </motion.div>
            </motion.li>
          ))}
        </ul>

        <h1 id="open-title" className={styles.title}>
          <motion.span
            className={styles.small}
            initial={{ opacity: 0, letterSpacing: "1em" }}
            animate={{ opacity: 1, letterSpacing: "0.32em" }}
            transition={{ delay: wait(0.5), duration: 0.7 }}
          >
            Jeres
          </motion.span>
          <motion.span
            className={styles.big}
            initial={{ scale: 2.6, opacity: 0, filter: "blur(14px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: wait(0.2), duration: 0.7, ease: [0.2, 0.9, 0.3, 1] }}
          >
            Wrapped
          </motion.span>
          <motion.span
            className={styles.medium}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: wait(0.75), duration: 0.5 }}
          >
            er åben
          </motion.span>
        </h1>
      </motion.div>

      <motion.p
        className={styles.sub}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: wait(1.1), duration: 0.4 }}
      >
        {trip.name}
        <span>
          {trip.expenses.length} køb, {formatKr(tripTotal(trip))} og {trip.members.length} roller venter
        </span>
      </motion.p>

      <ul className={styles.people} aria-label="Har betalt">
        {trip.members.map((m, index) => (
          <motion.li
            key={m.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: wait(1.3 + index * 0.12) }}
          >
            <span className={styles.avatar} aria-hidden="true">
              {m.name.slice(0, 2).toUpperCase()}
              <motion.span
                className={styles.tick}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: wait(1.9 + index * 0.26), ease: ease.bump }}
              >
                ✓
              </motion.span>
            </span>
            {m.is_me ? "Dig" : m.name}
          </motion.li>
        ))}
      </ul>

      <motion.button
        ref={goRef}
        type="button"
        className={`btn ${styles.go}`}
        onClick={go}
        disabled={leaving}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: wait(2.6), duration: 0.4, ease: ease.bump }}
      >
        Se Wrapped
      </motion.button>

      {leaving && (
        <motion.div
          className={styles.cover}
          initial={{ clipPath: "circle(0% at 50% 92%)" }}
          animate={{ clipPath: "circle(150% at 50% 92%)" }}
          transition={{ duration: leaveTime / 1000, ease: [0.7, 0, 0.3, 1] }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
