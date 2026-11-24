"use client";

import { motion } from "motion/react";
import { ease } from "@/lib/motion";
import styles from "./Padlock.module.css";

// Hængelåsen fra F09. Revnerne går fra nøglehullet ud mod kanten, én ad gangen.
const crackPaths = [
  "M100 168 L84 150 L62 154 L40 134",
  "M100 168 L122 186 L138 208 L162 222",
  "M100 168 L118 140 L146 136 L176 116",
];

function Lock({ cracks }) {
  return (
    <svg viewBox="0 0 200 240" className={styles.svg} aria-hidden="true">
      <path d="M52 112V74a48 48 0 0 1 96 0v38" className={styles.shackle} />
      <rect x="22" y="104" width="156" height="122" rx="26" className={styles.body} />
      <circle cx="100" cy="160" r="15" className={styles.hole} />
      <rect x="93" y="162" width="14" height="36" rx="5" className={styles.hole} />
      {crackPaths.map((d, index) => (
        <path
          key={d}
          d={d}
          pathLength="100"
          className={`${styles.crack} ${index < cracks ? styles.cracked : ""}`}
        />
      ))}
    </svg>
  );
}

// cracks: 0–3 revner. broken: låsen springer i to halvdele, der flyver hver sin vej.
export default function Padlock({ cracks, broken }) {
  if (broken) {
    return (
      <div className={styles.lock}>
        {[-1, 1].map((side) => (
          <motion.div
            key={side}
            className={`${styles.half} ${side < 0 ? styles.left : styles.right}`}
            initial={{ x: 0, rotate: 0, opacity: 1 }}
            animate={{ x: side * 160, y: 80, rotate: side * 35, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.3, 0, 0.8, 0.4] }}
          >
            <Lock cracks={3} />
          </motion.div>
        ))}
      </div>
    );
  }

  // Låsen ryster mere for hver revne.
  const shake = 3 + cracks * 4;
  return (
    <motion.div
      className={`${styles.lock} ${styles.glow}`}
      style={{ "--glow": `${10 + cracks * 12}px` }}
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: cracks ? [0, -shake / 2, shake / 2, 0] : 0 }}
      transition={{ duration: 0.5, ease: ease.bump }}
    >
      <Lock cracks={cracks} />
    </motion.div>
  );
}
