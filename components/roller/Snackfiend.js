"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import { objectSrc } from "@/lib/categories";
import styles from "./Snackfiend.module.css";

// Snackfiend: et tryk på A2 i snackautomaten, og madkøbet falder ned i skuffen.
// Hylderne er pynt. Det, der falder, er personens dyreste madkøb.
const shelf = ["3d-sushi.png", "3d-rolls.png", "3d-beer.png", "3d-coffee.png", "3d-wine.png"];

export default function Snackfiend({ result }) {
  const reduceMotion = useReducedMotion();
  const item = result.object;

  return (
    <div className={styles.room}>
      <div className={styles.machine}>
        <ul className={styles.shelves}>
          {shelf.map((src) => (
            <li key={src}>
              <Image src={`/3d/${src}`} alt="" width={44} height={44} />
            </li>
          ))}
        </ul>
        <p className={styles.code}>A2</p>
        <div className={styles.tray} />
      </div>

      {/* A2 er den tomme plads i øverste række. Herfra falder købet ned i skuffen. */}
      {item && (
        <motion.div
          className={styles.drop}
          initial={{ y: 0, rotate: 0 }}
          animate={{ y: 120, rotate: [0, -12, 8, 0] }}
          transition={{ delay: reduceMotion ? 0 : 1.6, duration: 0.7, ease: ease.bump }}
        >
          <Image src={objectSrc(item.category)} alt="" width={56} height={56} />
        </motion.div>
      )}
    </div>
  );
}
