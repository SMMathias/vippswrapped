"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import { objectSrc } from "@/lib/categories";
import { TZ, formatKr } from "@/lib/format";
import styles from "./DagForDag.module.css";

// F12 · Turen dag for dag (prototype v19). Turen som en kurve: hvert køb er et hop
// op med tingen og beløbet. Til sidst bliver den dyreste dag orange.
// Kun data, vi har: købsdagen og beløbet. Placeringen inden for dagen er kun layout.
const width = 340; // kurvens koordinater (SVG viewBox)
const height = 260;
const drawTime = 2.6; // sekunder om at tegne hele kurven

// "2026-11-06": købsdagen i dansk tid, så køb efter midnat tæller på den rigtige dag.
const dayOf = (iso) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: TZ });
const weekday = (day) =>
  new Date(day).toLocaleDateString("da-DK", { weekday: "long", timeZone: TZ });
const date = (day) =>
  new Date(day).toLocaleDateString("da-DK", { day: "numeric", month: "long", timeZone: TZ });

// Dagene med deres køb, og hvert køb som et punkt på kurven (x, y og samlet beløb).
function buildCurve(expenses, total) {
  const sorted = [...expenses].sort((a, b) => new Date(a.purchased_at) - new Date(b.purchased_at));
  const days = [...new Set(sorted.map((e) => dayOf(e.purchased_at)))].map((day) => ({
    day,
    expenses: sorted.filter((e) => dayOf(e.purchased_at) === day),
  }));
  const dayWidth = width / days.length;
  let sum = 0;
  const points = [];
  days.forEach((d, column) => {
    d.total = d.expenses.reduce((s, e) => s + Number(e.amount), 0);
    d.expenses.forEach((e, i) => {
      sum += Number(e.amount);
      points.push({
        e,
        x: column * dayWidth + ((i + 1) / (d.expenses.length + 1)) * dayWidth,
        y: height - (sum / total) * (height - 30),
      });
    });
  });
  // Trappen: vandret hen til købet, så lodret op med beløbet.
  let path = `M 0 ${height}`;
  let lastY = height;
  for (const p of points) {
    path += ` L ${p.x} ${lastY} L ${p.x} ${p.y}`;
    lastY = p.y;
  }
  path += ` L ${width} ${lastY}`;
  return { days, points, path, dayWidth };
}

export default function DagForDag({ trip, total }) {
  const reduceMotion = useReducedMotion();
  const wait = (seconds) => (reduceMotion ? 0 : seconds);
  const { days, points, path, dayWidth } = buildCurve(trip.expenses, total);
  const biggest = days.reduce((a, b) => (b.total > a.total ? b : a));
  const biggestIndex = days.indexOf(biggest);

  return (
    <div className={styles.scene}>
      <p className={styles.sticker}>Turen dag for dag</p>
      <h2 className={styles.title}>
        {days.length} {days.length === 1 ? "dag" : "dage"}
      </h2>
      <p className={styles.sub}>{formatKr(total)} i alt</p>

      <div className={styles.chart} aria-hidden="true">
        <svg viewBox={`0 0 ${width} ${height}`} className={styles.svg} preserveAspectRatio="none">
          {/* Den dyreste dag lyser op, når kurven er tegnet. */}
          <motion.rect
            className={styles.best}
            x={biggestIndex * dayWidth}
            y="0"
            width={dayWidth}
            height={height}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: wait(drawTime + 0.2), duration: 0.5 }}
          />
          <motion.path
            className={styles.line}
            d={path}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: drawTime, ease: "linear" }}
          />
        </svg>

        {/* Hvert køb hopper op over sit punkt med tingen og beløbet. */}
        {points.map((p, index) => (
          <motion.div
            key={p.e.id}
            className={styles.item}
            style={{ left: `${(p.x / width) * 100}%`, top: `${(p.y / height) * 100}%` }}
            initial={{ opacity: 0, y: 20, scale: 0.4 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: wait(((index + 1) / points.length) * drawTime), ease: ease.bump }}
          >
            <Image src={objectSrc(p.e.category)} alt="" width={48} height={48} />
            <span>+{formatKr(p.e.amount)}</span>
          </motion.div>
        ))}
      </div>

      <ul className={styles.days}>
        {days.map((d) => (
          <li key={d.day} className={d === biggest ? styles.biggest : ""}>
            <b>{weekday(d.day)}</b>
            <span>{date(d.day)}</span>
            <b>{formatKr(d.total)}</b>
          </li>
        ))}
      </ul>

      <motion.p
        className={styles.sum}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: wait(drawTime + 0.4) }}
      >
        {weekday(biggest.day)} var den dyreste dag med {formatKr(biggest.total)} på{" "}
        {biggest.expenses.length} køb
      </motion.p>
    </div>
  );
}
