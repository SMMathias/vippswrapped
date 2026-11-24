"use client";

import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import styles from "./Kaffejunkien.module.css";

// Kaffejunkien: én kop for hvert kaffekøb (højst 6). Hver kop glider ind, fyldes
// og damper. Koppene kommer én ad gangen, så man kan tælle dem.
export default function Kaffejunkien({ result }) {
  const reduceMotion = useReducedMotion();
  const cups = Math.min(6, result.score);
  const at = (index) => (reduceMotion ? 0 : 1 + index * 0.45);

  return (
    <div className={styles.cafe}>
      <ul className={styles.cups}>
        {Array.from({ length: cups }, (_, index) => (
          <motion.li
            key={index}
            // Usynlig, indtil den glider ind, så koppen ikke venter ude til venstre på skærmen.
            initial={{ x: -320, rotate: -20, opacity: 0 }}
            animate={{ x: 0, rotate: 0, opacity: 1 }}
            transition={{
              delay: at(index),
              duration: 0.45,
              ease: ease.bump,
              opacity: { delay: at(index), duration: 0.1 },
            }}
          >
            <span className={styles.cup}>
              <motion.i
                className={styles.coffee}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: at(index) + 0.35, duration: 0.4 }}
              />
            </span>
            <span className={styles.steam} aria-hidden="true">
              <i />
              <i />
            </span>
          </motion.li>
        ))}
      </ul>
      <div className={styles.shelf} />
    </div>
  );
}
