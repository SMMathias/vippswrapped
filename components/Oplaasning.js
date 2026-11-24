"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Flyvere from "@/components/Flyvere";
import Padlock from "@/components/Padlock";
import Slutskaerm from "@/components/Slutskaerm";
import { objectSrc } from "@/lib/categories";
import { play } from "@/lib/feedback";
import { nameOf } from "@/lib/status";
import { assignRoles } from "@/lib/wrapped";
import styles from "./Oplaasning.module.css";

// F09 · Oplåsningen: det store øjeblik, når alle har betalt (prototype v19).
// Beskeden kommer, hængelåsen revner tre gange og springer, "Jeres Wrapped"
// hvirvler forbi, turens ting flyver ud mod skærmen, og nattehimlen åbner.
// Hvert trin har sin ventetid i ms. Reduceret bevægelse: slutskærmen med det samme.
const steps = [
  { name: "start", wait: 300 },
  { name: "push", wait: 1700 },
  { name: "lock", wait: 1100 },
  { name: "crack1", wait: 700 },
  { name: "crack2", wait: 700 },
  { name: "crack3", wait: 800 },
  { name: "break", wait: 500 },
  { name: "title", wait: 1500 },
  { name: "fly", wait: 2300 },
  { name: "open" },
];
const last = steps.length - 1;
const breakStep = steps.findIndex((s) => s.name === "break");
const crackCount = { crack1: 1, crack2: 2, crack3: 3 };

// Den, der betalte som den sidste, ud fra tidspunktet på betalingerne.
function lastPayer(trip) {
  const paid = trip.payments.filter((p) => p.paid_at);
  if (!paid.length) return null;
  const latest = paid.reduce((a, b) => (new Date(b.paid_at) > new Date(a.paid_at) ? b : a));
  return latest.from_member === trip.me?.id ? "Du" : nameOf(trip, latest.from_member);
}

export default function Oplaasning({ trip, onDone }) {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const name = steps[step].name;
  const open = step === last;

  const payer = lastPayer(trip);
  const items = [...new Set(trip.expenses.map((e) => objectSrc(e.category)))].slice(0, 8);
  const roles = assignRoles(trip).map((r) => r.role.name);

  // Næste trin efter ventetiden. Reduceret bevægelse springer direkte til slutningen.
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setStep(reduceMotion ? last : step + 1), reduceMotion ? 0 : steps[step].wait);
    return () => clearTimeout(timer);
  }, [step, open, reduceMotion]);

  // Lyd på de to store øjeblikke: beskeden (tik) og låsen, der springer (bump).
  useEffect(() => {
    if (name === "push") play("tick");
    if (name === "break") play("bump");
  }, [name]);

  return (
    <main className={styles.screen} aria-labelledby="open-title">
      {/* Nattehimlen: stjerner og en galakse, der drejer langsomt (CSS). */}
      <div className={`${styles.sky} ${step >= breakStep ? styles.skyOpen : ""}`} aria-hidden="true" />

      <motion.div
        className={styles.push}
        initial={{ y: "-150%" }}
        animate={{ y: name === "push" ? 0 : "-150%" }}
        transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
        role="status"
      >
        {name === "push" && (
          <>
            <b>Jeres Wrapped er åben</b>
            <span>
              {payer ? `${payer} betalte som den sidste. ` : ""}Hele gruppen får denne besked.
            </span>
          </>
        )}
      </motion.div>

      {step >= 2 && step <= breakStep && (
        <div className={styles.center}>
          <Padlock cracks={crackCount[name] ?? 0} broken={name === "break"} />
        </div>
      )}

      {/* Hvidt lysglimt, når låsen springer. */}
      {name === "break" && (
        <motion.div
          className={styles.flash}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
          aria-hidden="true"
        />
      )}

      {/* "Jeres Wrapped" hvirvler ind i 3D og forsvinder ind i midten igen. */}
      {(name === "title" || name === "fly") && (
        <div className={styles.center} aria-hidden="true">
          <motion.p
            className={styles.logo}
            initial={{ opacity: 0 }}
            animate={{
              rotateX: [58, 40, 30, 50],
              rotateZ: [220, 10, -25, -300],
              scale: [3.2, 1.15, 0.95, 0.04],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ duration: 3, times: [0, 0.35, 0.62, 1], ease: "easeInOut" }}
            style={{ transformPerspective: 700 }}
          >
            <span>Jeres</span> Wrapped
          </motion.p>
        </div>
      )}

      {name === "fly" && <Flyvere items={items} labels={roles} />}

      {open && <Slutskaerm trip={trip} items={items} onDone={onDone} />}

      {!open && (
        <button type="button" className={styles.skip} onClick={() => setStep(last)}>
          Spring over
        </button>
      )}
    </main>
  );
}
