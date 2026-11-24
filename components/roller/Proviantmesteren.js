"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { objectSrc } from "@/lib/categories";
import { play } from "@/lib/feedback";
import styles from "./Proviantmesteren.module.css";

// Proviantmesteren: indkøbet kører ind på kassebåndet og bliver scannet med et bip.
const scanAt = 2.2; // sekunder, til tingen når scanneren

export default function Proviantmesteren({ result }) {
  const reduceMotion = useReducedMotion();
  const item = result.object;

  // Bip, når tingen bliver scannet (play() er stille ved reduceret bevægelse).
  useEffect(() => {
    const timer = setTimeout(() => play("tick"), reduceMotion ? 0 : scanAt * 1000);
    return () => clearTimeout(timer);
  }, [reduceMotion]);

  return (
    <div className={styles.shop}>
      <div className={styles.scanner}>
        <motion.span
          className={styles.laser}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.3, 1, 0] }}
          transition={{ delay: reduceMotion ? 0 : scanAt, duration: 0.7 }}
        />
      </div>
      {item && (
        <motion.div
          className={styles.item}
          initial={{ x: 360 }}
          animate={{ x: 0 }}
          transition={{ delay: 1, duration: scanAt - 1, ease: "easeOut" }}
        >
          <Image src={objectSrc(item.category)} alt="" width={110} height={110} />
        </motion.div>
      )}
      <div className={styles.belt} />
    </div>
  );
}
