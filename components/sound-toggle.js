"use client";

import { useSyncExternalStore } from "react";
import {
  getServerSoundSnapshot,
  getSoundSnapshot,
  setSoundOn,
  subscribeSound,
} from "@/lib/feedback";
import { SoundIcon } from "./icons";
import styles from "./sound-toggle.module.css";

// Lyd-knap (Figma: SoundToggle, Lyd=Til/Fra). Slår lyd og vibration til og fra.
// aria-pressed fortæller skærmlæsere, om lyden er til. Valget huskes i localStorage.
// Ved reduceret bevægelse er lyden altid fra, og knappen siger hvorfor.
export function SoundToggle() {
  const state = useSyncExternalStore(subscribeSound, getSoundSnapshot, getServerSoundSnapshot);
  const on = state === "til";
  const reduced = state === "reduceret";

  return (
    <button
      type="button"
      className={styles.toggle}
      aria-pressed={on}
      disabled={reduced}
      title={reduced ? "Lyd er slået fra, fordi din enhed beder om reduceret bevægelse" : undefined}
      onClick={() => setSoundOn(!on)}
    >
      <SoundIcon on={on} />
      <span className="text-caption-sm">Lyd</span>
      {reduced && <span className="visually-hidden">, slået fra på grund af reduceret bevægelse</span>}
    </button>
  );
}
