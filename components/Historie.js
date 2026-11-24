"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackIcon } from "@/components/icons";
import styles from "./Historie.module.css";

// Wrapped-kortene som en historie (B14): tryk, swipe og piletaster.
// Hvert kort er { key, theme, content, end }. Kortene bygges i app/wrapped/page.js.
export default function Historie({ cards, title }) {
  const router = useRouter();
  const last = cards.length - 1;
  const [index, setIndex] = useState(0);
  const pointerStart = useRef(null);
  const swiped = useRef(false);

  const go = (delta) => setIndex((i) => Math.min(last, Math.max(0, i + delta)));

  // Piletaster, Home/End og Escape. Ingen automatisk afspilning, så der er intet at pause.
  // Taster med Ctrl/Alt/Cmd ignoreres, så browserens egne genveje (fx Alt+← = tilbage) virker.
  useEffect(() => {
    function onKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.key === "ArrowRight") setIndex((i) => Math.min(last, i + 1));
      else if (event.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      else if (event.key === "Home") setIndex(0);
      else if (event.key === "End") setIndex(last);
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
  function tap(delta) {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    go(delta);
  }

  const card = cards[index];

  return (
    <main
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
        onClick={() => tap(-1)}
        aria-disabled={index === 0}
      >
        <span className="visually-hidden">Forrige kort</span>
      </button>
      <button
        type="button"
        className={styles.next}
        onClick={() => tap(1)}
        aria-disabled={index === last}
      >
        <span className="visually-hidden">Næste kort</span>
      </button>

      {/* key: kortet bygges forfra ved hvert skift, så animationen kører igen. */}
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
            <button type="button" className="btn btn-secondary" onClick={() => setIndex(0)}>
              Se igen
            </button>
            <Link href="/" className={`btn ${styles.endPrimary}`}>
              Til turen
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
