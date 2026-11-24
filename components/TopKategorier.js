"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import { objectSrc } from "@/lib/categories";
import { formatKr } from "@/lib/format";
import { KIND_LABELS } from "@/lib/wrapped";
import styles from "./TopKategorier.module.css";

// F12b · Top kategorier (prototype v19). Hvert køb falder ned som en klods i sin
// kategori, så høj som beløbet. Tårnene stiller sig i rækkefølge, og vinderen får "Nr. 1".
// Kun rigtige køb, ingen mellemregninger.
const towerHeight = 300; // px for det højeste tårn
const dropGap = 0.25; // sekunder mellem hver klods

// Kategorierne i den rækkefølge, de første gang blev brugt på turen.
function buildTowers(expenses) {
  const sorted = [...expenses].sort((a, b) => new Date(a.purchased_at) - new Date(b.purchased_at));
  const towers = [];
  sorted.forEach((e, order) => {
    const kind = e.category?.kind ?? "andet";
    let tower = towers.find((t) => t.kind === kind);
    if (!tower) {
      tower = { kind, label: KIND_LABELS[kind] ?? "Andet", total: 0, blocks: [] };
      towers.push(tower);
    }
    tower.total += Number(e.amount);
    tower.blocks.push({ e, order });
  });
  return towers;
}

export default function TopKategorier({ trip, total }) {
  const reduceMotion = useReducedMotion();
  const towers = buildTowers(trip.expenses);
  const ranked = [...towers].sort((a, b) => b.total - a.total);
  const highest = ranked[0].total;
  const landed = trip.expenses.length * dropGap + 0.8; // sekunder, til sidste klods er landet
  // Når alle klodser er landet, stiller tårnene sig i rækkefølge (motion layout).
  const [sorted, setSorted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSorted(true), reduceMotion ? 0 : landed * 1000);
    return () => clearTimeout(timer);
  }, [landed, reduceMotion]);

  const shown = sorted ? ranked : towers;
  const winner = ranked[0];

  return (
    <div className={styles.scene}>
      <p className={styles.sticker}>Det brugte I mest på</p>
      <h2 className={styles.title}>Top kategorier</h2>

      <ol className={styles.towers}>
        {shown.map((t) => (
          <motion.li key={t.kind} layout transition={{ duration: 0.6, ease: ease.inOut }}>
            {sorted && t === winner && (
              <motion.span
                className={styles.first}
                initial={{ scale: 2, opacity: 0, rotate: -6 }}
                animate={{ scale: 1, opacity: 1, rotate: -6 }}
                transition={{ delay: 0.5, ease: ease.bump }}
              >
                Nr. 1
              </motion.span>
            )}
            <b className={styles.amount}>{formatKr(t.total)}</b>
            {/* Klodserne: én pr. køb, så høj som beløbet. Den nyeste ligger øverst. */}
            <span className={`${styles.tower} ${t === winner && sorted ? styles.win : ""}`}>
              {[...t.blocks].reverse().map(({ e, order }) => (
                <motion.span
                  key={e.id}
                  className={styles.block}
                  style={{ height: (Number(e.amount) / highest) * towerHeight }}
                  initial={{ y: -500, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: reduceMotion ? 0 : 0.4 + order * dropGap,
                    type: "spring",
                    bounce: 0.35,
                    duration: 0.7,
                  }}
                >
                  {/* Billedet kun, hvis klodsen er høj nok til det. */}
                  {(Number(e.amount) / highest) * towerHeight >= 40 && (
                    <Image src={objectSrc(e.category)} alt="" width={34} height={34} />
                  )}
                </motion.span>
              ))}
            </span>
            <span className={styles.label}>{t.label}</span>
          </motion.li>
        ))}
      </ol>

      <motion.p
        className={styles.sum}
        initial={{ opacity: 0 }}
        animate={{ opacity: sorted ? 1 : 0 }}
        transition={{ delay: reduceMotion ? 0 : 0.8 }}
      >
        {winner.label} fyldte {Math.round((winner.total / total) * 100)} % af turen
      </motion.p>
    </div>
  );
}
