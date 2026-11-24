"use client";

import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import { formatKr } from "@/lib/format";
import styles from "./Skyldneren.module.css";

// Skyldneren: kuverten med regningen flyver ind, flappen åbner, regningen kommer op,
// og "Betal" bliver til et grønt "Betalt". Wrapped åbner jo kun, når alle har betalt.
export default function Skyldneren({ result }) {
  const reduceMotion = useReducedMotion();
  const wait = (seconds) => (reduceMotion ? 0 : seconds);

  return (
    <div className={styles.desk}>
      <motion.div
        className={styles.envelope}
        initial={{ x: -420, y: 60, rotate: -24 }}
        animate={{ x: 0, y: 0, rotate: 0 }}
        transition={{ delay: wait(0.4), duration: 0.8, ease: ease.bump }}
      >
        <i className={styles.back} />

        {/* Regningen ligger i kuverten og trækkes op, når flappen er åben. */}
        <motion.div
          className={styles.bill}
          initial={{ y: 0 }}
          animate={{ y: -120 }}
          transition={{ delay: wait(1.6), duration: 0.5, ease: ease.bump }}
        >
          <span className={styles.head}>Til betaling</span>
          <b>{formatKr(result.score)}</b>
          <span className={styles.pay}>
            Betal
            <motion.span
              className={styles.paid}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: wait(2.6), duration: 0.3, ease: ease.bump }}
            >
              ✓ Betalt
            </motion.span>
          </span>
        </motion.div>

        <i className={styles.front} />
        {/* Flappen vipper op om sin øverste kant og lægger sig bag regningen. */}
        <motion.i
          className={styles.flap}
          initial={{ rotateX: 0, zIndex: 3 }}
          animate={{ rotateX: 180, zIndex: 0 }}
          transition={{ delay: wait(1.3), duration: 0.3 }}
        />
      </motion.div>
    </div>
  );
}
