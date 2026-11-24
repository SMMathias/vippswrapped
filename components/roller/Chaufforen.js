"use client";

import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import styles from "./Chaufforen.module.css";

// Chaufføren: en bil kører ind på vejen og bremser, mens taxameteret ovenover tæller op.
const drive = 2.2; // sekunder, samme tid som tallet tæller

export default function Chaufforen() {
  const reduceMotion = useReducedMotion();
  const start = reduceMotion ? 0 : 0.8;

  return (
    <div className={styles.road}>
      <div className={styles.hills} />
      <div className={styles.lane}>
        {/* Stregerne kører, indtil bilen holder stille. */}
        <motion.i
          className={styles.dashes}
          initial={{ x: 0 }}
          animate={{ x: -480 }}
          transition={{ delay: start, duration: drive, ease: "easeOut" }}
        />
      </div>

      <motion.div
        className={styles.car}
        // Usynlig, indtil den kører, så bagenden ikke stikker ind i venstre kant på brede skærme.
        initial={{ x: -320, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: start, duration: drive, ease: "easeOut", opacity: { delay: start, duration: 0.1 } }}
      >
        <svg viewBox="0 0 200 104" className={styles.svg}>
          <path
            d="M14 70V56c0-8 5-13 14-14l22-3 22-22c4-4 9-6 15-6h46c7 0 12 3 16 8l16 20 14 3c8 2 13 8 13 16v12c0 5-3 8-8 8H22c-5 0-8-3-8-8Z"
            className={styles.body}
          />
          <path
            d="M60 40 80 21c3-3 6-4 10-4h20v23Zm58 0V17h26c4 0 7 2 9 4l15 19Z"
            className={styles.window}
          />
          {[56, 150].map((cx) => (
            <motion.g
              key={cx}
              initial={{ rotate: 0 }}
              animate={{ rotate: 900 }}
              transition={{ delay: start, duration: drive, ease: "easeOut" }}
            >
              <circle cx={cx} cy="78" r="17" className={styles.tyre} />
              <path d={`M${cx} 64v28M${cx - 14} 78h28`} className={styles.spokes} />
            </motion.g>
          ))}
        </svg>
      </motion.div>
    </div>
  );
}
