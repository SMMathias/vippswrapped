"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "@/lib/motion";
import { objectSrc } from "@/lib/categories";
import { formatKr } from "@/lib/format";
import { play } from "@/lib/feedback";
import { PAGES } from "@/components/Rolle";
import styles from "./Fotoboks.module.css";

// F18 · Holdet i fotoboksen (prototype v19). Én person ad gangen: tre lamper tæller ned,
// blitzen går, og næste person træder frem. Sneglen kommer for sent og bliver uskarp.
// Til sidst printes hele fotostrimlen. Over 5 personer deles strimlen i to.
const SHORT = {
  bankdirektoren: "lagt ud",
  natteravnen: "natkøb",
  proviantmesteren: "på indkøb",
  chaufforen: "på transport",
  kaffejunkien: "kaffekøb",
  snackfiend: "madkøb",
  skyldneren: "skyldte",
  passageren: "lagt ud",
};
const frameColors = ["orange", "lilac", "purple", "peach"];

// Den korte tekst under navnet, fx "Laura, 840 kr. på indkøb".
function stat({ member, role, score }) {
  const name = member.is_me ? "Dig" : member.name;
  if (role.id === "sneglen") return `${name}, betalte sidst`;
  const value = PAGES[role.id].kr ? formatKr(score) : score;
  return `${name}, ${value} ${SHORT[role.id]}`;
}

const initials = (member) => member.name.slice(0, 2).toUpperCase();

// Rollenavnet i to linjer, delt samme sted som på rollesiden (PAGES.split).
function RoleName({ role }) {
  const split = PAGES[role.id].split;
  const lines = split ? [role.name.slice(0, split), role.name.slice(split)] : [role.name];
  return lines.map((line) => <span key={line}>{line}</span>);
}

export default function Fotoboks({ trip, results }) {
  const reduceMotion = useReducedMotion();
  const count = results.length;
  // shot: hvem der står i boksen nu. Når shot === count, er strimlen printet.
  const [shot, setShot] = useState(0);
  const shotTime = count > 6 ? 1400 : 2000; // ms pr. billede, hurtigere ved mange

  useEffect(() => {
    if (shot === count) return;
    const timer = setTimeout(
      () => setShot(reduceMotion ? count : shot + 1),
      reduceMotion ? 0 : shotTime,
    );
    // Lukkerlyden, når blitzen går (play() er stille ved reduceret bevægelse).
    const click = setTimeout(() => play("tick"), shotTime * 0.6);
    return () => {
      clearTimeout(timer);
      clearTimeout(click);
    };
  }, [shot, count, shotTime, reduceMotion]);

  const columns = count > 5 ? 2 : 1;
  const perColumn = Math.ceil(count / columns);
  const frameHeight = Math.min(110, Math.floor((500 - perColumn * 6) / perColumn));
  const strips = Array.from({ length: columns }, (_, c) =>
    results.slice(c * perColumn, (c + 1) * perColumn),
  );

  return (
    <div className={styles.booth}>
      <i className={styles.curtain} aria-hidden="true" />
      <p className={styles.sticker}>Holdet</p>

      {shot < count ? (
        <Shot key={shot} result={results[shot]} index={shot} count={count} time={shotTime / 1000} />
      ) : (
        <div className={styles.strips} data-columns={columns}>
          {strips.map((strip, c) => (
            <motion.ol
              key={c}
              className={styles.strip}
              initial={{ clipPath: "inset(0 0 100% 0)", y: -30 }}
              animate={{ clipPath: "inset(0 0 0% 0)", y: 0 }}
              transition={
                reduceMotion ? { duration: 0 } : { delay: c * 0.2, duration: 1.1, ease: "easeOut" }
              }
            >
              {strip.map((r, j) => {
                const color = frameColors[(c * perColumn + j) % frameColors.length];
                return (
                  <li
                    key={r.member.id}
                    className={`${styles.frame} ${styles[color]}`}
                    data-late={r.role.id === "sneglen" || undefined}
                    style={{ height: frameHeight }}
                  >
                    <span className={styles.avatar}>{initials(r.member)}</span>
                    {r.object && (
                      <Image src={objectSrc(r.object.category)} alt="" width={44} height={44} />
                    )}
                    <span className={styles.text}>
                      <b>
                        <RoleName role={r.role} />
                      </b>
                      <small>{stat(r)}</small>
                    </span>
                  </li>
                );
              })}
              <li className={styles.label}>{trip.name}</li>
            </motion.ol>
          ))}
        </div>
      )}
    </div>
  );
}

// Ét billede i søgeren. time er sekunder for hele billedet.
function Shot({ result, index, count, time }) {
  const { member, role } = result;
  const late = role.id === "sneglen";
  const flashAt = time * 0.6;
  const color = frameColors[index % frameColors.length];

  return (
    <div className={styles.viewfinder}>
      <div className={styles.lamps} aria-hidden="true">
        {[0, 1, 2].map((l) => (
          <motion.i
            key={l}
            initial={{ opacity: 0.25 }}
            animate={{ opacity: 1 }}
            transition={{ delay: (flashAt / 3) * (l + 0.5), duration: 0.1 }}
          />
        ))}
      </div>

      <div className={`${styles.picture} ${styles[color]}`}>
        {/* Sneglen kommer glidende ind fra siden lige før blitzen og bliver uskarp. */}
        <motion.span
          className={styles.bigAvatar}
          initial={late ? { x: -260 } : { y: 60, scale: 0.7, opacity: 0 }}
          animate={late ? { x: 0, filter: "blur(3px)" } : { y: 0, scale: 1, opacity: 1 }}
          transition={{
            delay: late ? flashAt - 0.5 : 0,
            duration: late ? 0.6 : 0.35,
            ease: ease.bump,
          }}
        >
          {initials(member)}
        </motion.span>
        {result.object && (
          <motion.span
            className={styles.prop}
            initial={{ x: 60, y: -40, rotate: 40, scale: 0.4, opacity: 0 }}
            animate={{ x: 0, y: 0, rotate: -8, scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: ease.bump }}
          >
            <Image src={objectSrc(result.object.category)} alt="" width={72} height={72} />
          </motion.span>
        )}
        <p className={styles.role}>
          <RoleName role={role} />
        </p>
        <p className={styles.who}>{stat(result)}</p>
      </div>

      <p className={styles.counter}>
        Billede {index + 1} af {count}
      </p>

      {/* Blitzen: hele søgeren bliver hvid et øjeblik. */}
      <motion.i
        className={styles.flash}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.95, 0] }}
        transition={{ delay: flashAt, duration: 0.4, times: [0, 0.1, 1] }}
      />
    </div>
  );
}
