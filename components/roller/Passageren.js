"use client";

import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import styles from "./Passageren.module.css";

// Passageren: ud ad bussens vindue suser landskabet forbi, mens man læner sig tilbage.
// Bakkerne er to lag, der glider i hver sin fart (det bagerste langsomst).
export default function Passageren({ result }) {
  const reduceMotion = useReducedMotion();
  const initials = result.member.name.slice(0, 2).toUpperCase();

  return (
    <div className={styles.bus}>
      <motion.div
        className={styles.window}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.3, duration: 0.5, ease: ease.bump }}
      >
        <i className={styles.sun} />
        <i className={`${styles.hills} ${styles.far}`} />
        <i className={`${styles.hills} ${styles.near}`} />
        <i className={styles.pole} />
      </motion.div>
      <div className={styles.seat}>
        <span className={styles.avatar}>{initials}</span>
      </div>
    </div>
  );
}
