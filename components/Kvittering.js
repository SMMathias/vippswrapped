"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { ease } from "@/lib/motion";
import { objectSrc } from "@/lib/categories";
import { formatKr } from "@/lib/format";
import { play } from "@/lib/feedback";
import styles from "./Kvittering.module.css";

// F11 · Bonen: "Det brugte I sammen" (prototype v19).
// Kvitteringen skrives linje for linje, mens turens ting falder ned på gulvet.
// Totalen tæller op, og til sidst lander "X kr. hver". Tingene kan trækkes rundt.
const firstLine = 0.8; // sekunder, før første linje skrives
const printTime = 3.2; // højst så lang tid tager hele bonen
const maxItems = 8; // flere ting kan ikke være på gulvet

export default function Kvittering({ trip, total, perPerson }) {
  const reduceMotion = useReducedMotion();
  const floorRef = useRef(null);
  const expenses = [...trip.expenses].sort((a, b) => new Date(a.purchased_at) - new Date(b.purchased_at));
  // 0,4 sek. pr. linje, men hurtigere ved mange køb, så bonen aldrig tager mere end printTime.
  const lineDelay = Math.min(0.4, printTime / Math.max(1, expenses.length));
  const doneAt = firstLine + expenses.length * lineDelay;
  const days = Math.round((Date.parse(trip.endsOn) - Date.parse(trip.startsOn)) / 86_400_000) + 1;

  // Totalen tæller op fra 0, i samme tempo som linjerne skrives.
  const count = useMotionValue(0);
  const shown = useTransform(count, (value) => formatKr(Math.round(value)));
  useEffect(() => {
    const counting = animate(count, total, {
      duration: reduceMotion ? 0 : doneAt - firstLine,
      delay: reduceMotion ? 0 : firstLine,
      ease: "linear",
    });
    // Et blødt bump, når "X kr. hver" lander.
    const timer = setTimeout(() => play("bump"), reduceMotion ? 0 : (doneAt + 0.3) * 1000);
    return () => {
      counting.stop();
      clearTimeout(timer);
    };
  }, [count, total, doneAt, reduceMotion]);

  return (
    <div className={styles.scene}>
      <p className={styles.sticker}>Det brugte I sammen</p>

      <div className={styles.printer} aria-hidden="true" />
      <motion.div
        className={styles.receipt}
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        animate={{ clipPath: "inset(0 0 0% 0)" }}
        transition={{ duration: doneAt, ease: "linear" }}
      >
        <p className={styles.head}>Kvittering</p>
        <p className={styles.place}>
          {trip.name}, {days} {days === 1 ? "dag" : "dage"}
        </p>
        <p className={styles.total}>
          <span>I alt</span>
          <motion.b>{shown}</motion.b>
        </p>
        <ul className={styles.lines}>
          {expenses.map((e, index) => (
            <motion.li
              key={e.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: firstLine + index * lineDelay, duration: 0.2 }}
            >
              <span>{e.title}</span>
              <b>{formatKr(e.amount)}</b>
            </motion.li>
          ))}
        </ul>
        <motion.p
          className={styles.each}
          initial={{ opacity: 0, scale: 1.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: doneAt + 0.3, duration: 0.4, ease: ease.bump }}
        >
          {formatKr(Math.round(perPerson))} hver
        </motion.p>
      </motion.div>

      {/* Tingene falder ned med et hop og kan trækkes rundt (motion drag). Pynt: aria-hidden. */}
      <div ref={floorRef} className={styles.floor} aria-hidden="true">
        {expenses.slice(0, maxItems).map((e, index) => (
          <motion.div
            key={e.id}
            className={styles.item}
            style={{ left: `${4 + index * 11}%` }}
            initial={{ y: -700, rotate: (index % 2 ? 1 : -1) * 30 }}
            animate={{ y: 0, rotate: ((index * 31) % 30) - 15 }}
            transition={{ delay: firstLine + index * lineDelay, type: "spring", bounce: 0.45, duration: 0.9 }}
            drag
            dragConstraints={floorRef}
            dragElastic={0.2}
            whileDrag={{ scale: 1.15 }}
            // Et træk i en ting må ikke tælle som et swipe til næste kort.
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
          >
            <Image src={objectSrc(e.category)} alt="" width={80} height={80} draggable={false} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
