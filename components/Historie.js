"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { BackIcon } from "@/components/icons";
import { ease } from "@/lib/motion";
import styles from "./Historie.module.css";

// Wrapped-kortene som en historie (B14): tryk, swipe og piletaster.
// Hvert kort er { key, theme, content, end }. Kortene bygges i app/wrapped/page.js.
// Overgang: det nye kort vokser frem som en cirkel fra der, man trykkede (prototype v19).

// Næste visning: hvilket kort, hvilket kort vi kom fra, og hvor cirklen starter.
// Uden et tryk (tastatur, swipe) starter cirklen midt på skærmen.
function move(view, next, last, point) {
  if (next < 0 || next > last || next === view.index) return view;
  return {
    index: next,
    from: view.index,
    x: point ? `${point.x}px` : "50%",
    y: point ? `${point.y}px` : "50%",
  };
}

export default function Historie({ cards, title }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const last = cards.length - 1;
  const [view, setView] = useState({
    index: 0,
    from: null,
    x: "50%",
    y: "50%",
  });
  const index = view.index;
  const mainRef = useRef(null);
  const pointerStart = useRef(null);
  const swiped = useRef(false);

  const go = (delta, point) => setView((v) => move(v, v.index + delta, last, point));

  // Piletaster, Home/End og Escape. Ingen automatisk afspilning, så der er intet at pause.
  // Taster med Ctrl/Alt/Cmd ignoreres, så browserens egne genveje (fx Alt+← = tilbage) virker.
  useEffect(() => {
    function onKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") setView((v) => move(v, v.index + 1, last));
      else if (event.key === "ArrowLeft") setView((v) => move(v, v.index - 1, last));
      else if (event.key === "Home") setView((v) => move(v, 0, last));
      else if (event.key === "End") setView((v) => move(v, last, last));
      else if (event.key === "Escape") router.push("/");
      else return;
      event.preventDefault();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [last, router]);

  // Swipe: mere end 50 px vandret tæller som et swipe og ikke et tryk.
  function onPointerDown(event) {
    pointerStart.current = event.clientX;
    swiped.current = false;
  }
  function onPointerUp(event) {
    if (pointerStart.current === null) return;
    const dx = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(dx) > 50) {
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
    }
  }
  // Et swipe må ikke også tælle som et tryk på en af tap-zonerne.
  // Trykkets punkt i forhold til skærmen. Enter/mellemrum på knappen (detail 0) har intet punkt.
  function tap(delta, event) {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    const box = mainRef.current.getBoundingClientRect();
    const point = event.detail ? { x: event.clientX - box.left, y: event.clientY - box.top } : null;
    go(delta, point);
  }

  const card = cards[index];

  return (
    <main
      ref={mainRef}
      className={`${styles.story} ${styles[card.theme]}`}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* Fremdrift som i B14. Pynt: teksten "Kort x af y" står i kortets label. */}
      <div className={styles.progress} aria-hidden="true">
        {cards.map((c, i) => (
          <span key={c.key} className={i <= index ? styles.progressDone : ""} />
        ))}
      </div>

      {/* Test runde 2: tydelig vej tilbage. Pil og tekst øverst til venstre som
          i resten af appen (top-baren), i stedet for "Luk" til højre. */}
      <div className={styles.bar}>
        <Link href="/" className={`text-label-lg ${styles.close}`}>
          <BackIcon />
          Til turen
        </Link>
        <span className="text-label-md">{title}</span>
      </div>

      {/* Tap-zoner: venstre halvdel tilbage, højre halvdel frem (som stories). */}
      {/* aria-disabled i stedet for disabled: en knap med disabled mister fokus,
          så tastaturbrugere ville "falde ud" på første og sidste kort. */}
      <button
        type="button"
        className={styles.prev}
        onClick={(event) => tap(-1, event)}
        aria-disabled={index === 0}
      >
        <span className="visually-hidden">Forrige kort</span>
      </button>
      <button
        type="button"
        className={styles.next}
        onClick={(event) => tap(1, event)}
        aria-disabled={index === last}
      >
        <span className="visually-hidden">Næste kort</span>
      </button>

      {/* Det forrige korts farve ligger nederst, mens det nye kort vokser frem over den. */}
      {view.from !== null && (
        <div className={`${styles.backdrop} ${styles[cards[view.from].theme]}`} />
      )}

      {/* key: kortet bygges forfra ved hvert skift, så animationen kører igen. */}
      <motion.div
        key={card.key}
        className={`${styles.layer} ${styles[card.theme]}`}
        initial={view.from === null ? false : { clipPath: `circle(0px at ${view.x} ${view.y})` }}
        animate={{ clipPath: `circle(1200px at ${view.x} ${view.y})` }}
        transition={{ duration: reduceMotion ? 0 : 0.6, ease: ease.inOut }}
      >
        <section
          key={card.key}
          className={styles.card}
          aria-roledescription="kort"
          aria-label={`Kort ${index + 1} af ${cards.length}`}
          aria-live="polite"
        >
          {card.content}

          {index === 0 && (
            <p className={`text-caption-md ${styles.hint}`}>Tryk, swipe eller brug piletasterne</p>
          )}

          {card.end && (
            <div className={styles.endActions}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setView((v) => move(v, 0, last))}
              >
                Se igen
              </button>
              <Link href="/" className={`btn ${styles.endPrimary}`}>
                Til turen
              </Link>
            </div>
          )}
        </section>
      </motion.div>
    </main>
  );
}
