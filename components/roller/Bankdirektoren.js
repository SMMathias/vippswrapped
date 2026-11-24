"use client";

import { motion } from "motion/react";
import styles from "./Bankdirektoren.module.css";

// Bankdirektøren: boksdøren drejer og svinger op, og mønterne regner ned i en bunke.
const coins = 18;

export default function Bankdirektoren() {
  return (
    <div className={styles.vault}>
      <div className={styles.rays} />

      {/* Mønterne falder ned bag døren. Hver lander lidt forskudt, så de ligger i en bunke. */}
      {Array.from({ length: coins }, (_, index) => (
        <motion.span
          key={index}
          className={styles.coin}
          style={{ left: `${((index * 37) % 86) + 4}%`, bottom: (index % 3) * 16 + 8 }}
          // Usynlig, indtil den falder, så mønterne ikke hænger øverst på høje skærme.
          initial={{ y: -360, rotate: 0, opacity: 0 }}
          animate={{ y: 0, rotate: (index % 2 ? 1 : -1) * 200, opacity: 1 }}
          transition={{
            delay: 1.6 + index * 0.07,
            type: "spring",
            bounce: 0.4,
            duration: 0.8,
            opacity: { delay: 1.6 + index * 0.07, duration: 0.1 },
          }}
        >
          kr
        </motion.span>
      ))}

      {/* Døren: rattet drejer, og så svinger døren ud til venstre. */}
      <motion.div
        className={styles.door}
        initial={{ rotate: 0, x: 0 }}
        animate={{ rotate: [0, -180, -180], x: [0, 0, -420] }}
        transition={{ duration: 1.6, times: [0, 0.55, 1], ease: "easeInOut" }}
      >
        <span className={styles.wheel} />
      </motion.div>
    </div>
  );
}
