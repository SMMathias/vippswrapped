"use client";

import { motion, useReducedMotion } from "motion/react";
import styles from "./Sneglen.module.css";

// Sneglen: en snegl kravler meget langsomt over skærmen, og slimsporet skriver "Sidst".
const crawl = 5; // sekunder over skærmen

export default function Sneglen() {
  // Reduceret bevægelse: sneglen er allerede fremme, og ordet står der.
  const reduceMotion = useReducedMotion();
  const trail = reduceMotion ? { duration: 0 } : { delay: 0.6, duration: crawl, ease: "linear" };
  return (
    <div className={styles.garden}>
      {/* Ordet bliver synligt fra venstre i samme tempo, som sneglen kravler. */}
      <motion.p
        className={styles.word}
        initial={{ clipPath: "inset(0 100% 0 0)" }}
        animate={{ clipPath: "inset(0 0% 0 0)" }}
        transition={trail}
      >
        Sidst
      </motion.p>

      <motion.div
        className={styles.snail}
        initial={{ left: "-25%" }}
        animate={{ left: "72%" }}
        transition={trail}
      >
        <svg viewBox="0 0 120 80" className={styles.svg}>
          <path d="M8 74 Q60 64 112 74 L112 78 L8 78 Z" className={styles.body} />
          <path d="M96 70 L100 40 M100 40 l-2 -12 M100 40 l8 -10" className={styles.feelers} />
          <circle cx="100" cy="54" r="12" className={styles.body} />
          <circle cx="54" cy="46" r="28" className={styles.shell} />
          <path
            d="M54 46 m0 -6 a6 6 0 1 1 -6 6 a12 12 0 1 1 12 12 a18 18 0 1 1 -18 -18"
            className={styles.spiral}
          />
        </svg>
      </motion.div>
    </div>
  );
}
