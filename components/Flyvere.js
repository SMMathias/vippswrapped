"use client";

import Image from "next/image";
import { motion } from "motion/react";
import styles from "./Flyvere.module.css";

// F09 · turens ting og rollenavne flyver ud fra midten og forbi skærmen,
// som om man flyver gennem galaksen. Hver femte er et rollenavn.
const count = 30;
const distance = 600; // px fra midten, så de er ude af skærmen
const flyTime = 1.4; // sekunder pr. ting
const gap = 0.035; // sekunder mellem hver ting

export default function Flyvere({ items, labels }) {
  return (
    <div className={styles.flyers} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => {
        const angle = (index * 137.5 * Math.PI) / 180; // den gyldne vinkel: jævnt fordelt hele vejen rundt
        const label = index % 5 === 4 ? labels[index % labels.length] : null;
        const src = items[index % items.length];
        if (!label && !src) return null;
        return (
          <motion.div
            key={index}
            className={styles.flyer}
            initial={{ x: 0, y: 0, scale: 0.05, rotate: 0, opacity: 0 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              scale: 2.6 + (index % 3) * 0.9,
              rotate: index % 2 ? 240 : -240,
              opacity: [0, 1, 1],
            }}
            transition={{ duration: flyTime, delay: index * gap, ease: [0.62, 0, 0.92, 0.42] }}
          >
            {label ? (
              <span className={styles.label}>{label}</span>
            ) : (
              <Image src={src} alt="" width={72} height={72} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
