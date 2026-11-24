"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { TZ } from "@/lib/format";
import styles from "./Natteravnen.module.css";

// Natteravnen: uret drejer frem fra kl. 18 til det seneste natkøb, og månen står op.
// Timen tæller videre efter midnat (kl. 2 = 26), så viseren drejer den rigtige vej rundt.
const hourFormat = new Intl.DateTimeFormat("da-DK", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: TZ,
});
const nightHour = (iso) => {
  const h = Number(hourFormat.format(new Date(iso)));
  return h < 12 ? h + 24 : h;
};

// Stjernerne står fast, så de ligger det samme sted hver gang.
const stars = Array.from({ length: 14 }, (_, k) => ({ left: (k * 37) % 96, top: (k * 23) % 70 }));

export default function Natteravnen({ result }) {
  const reduceMotion = useReducedMotion();
  const latest = Math.max(22, ...result.items.map((e) => nightHour(e.purchased_at)));

  // Én værdi styrer både viserne og teksten: timen fra 18 til det seneste køb.
  const hour = useMotionValue(reduceMotion ? latest : 18);
  const hourHand = useTransform(hour, (h) => (h % 12) * 30);
  const minuteHand = useTransform(hour, (h) => (h % 1) * 360);
  const label = useTransform(hour, (h) => `kl. ${String(Math.floor(h) % 24).padStart(2, "0")}`);

  useEffect(() => {
    if (reduceMotion) return;
    const turning = animate(hour, latest, { delay: 1, duration: 2.6, ease: "easeInOut" });
    return () => turning.stop();
  }, [hour, latest, reduceMotion]);

  return (
    <div className={styles.sky}>
      {stars.map((s, k) => (
        <motion.i
          key={k}
          className={styles.star}
          style={{ left: `${s.left}%`, top: `${s.top}%` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 1.4 + (k % 5) * 0.3, duration: 0.6 }}
        />
      ))}

      <motion.div
        className={styles.moon}
        // Månen toner frem, mens den stiger, så den ikke står midt på himlen og venter.
        initial={{ y: 200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: reduceMotion ? 0 : 1,
          duration: reduceMotion ? 0 : 2.6,
          ease: "easeOut",
          opacity: { delay: reduceMotion ? 0 : 1, duration: reduceMotion ? 0 : 1 },
        }}
      />

      <div className={styles.clock}>
        {Array.from({ length: 12 }, (_, k) => (
          <i key={k} className={styles.tick} style={{ rotate: `${k * 30}deg` }} />
        ))}
        <motion.i className={styles.hour} style={{ rotate: hourHand }} />
        <motion.i className={styles.minute} style={{ rotate: minuteHand }} />
        <i className={styles.pin} />
      </div>
      <motion.p className={styles.time}>{label}</motion.p>
    </div>
  );
}
