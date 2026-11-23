"use client";

import { useEffect, useState } from "react";

// Klokken nu, opdateret hvert `intervalMs`. Bruges til Ryk-nedtællingen.
// Date.now() må ikke kaldes direkte under render (render skal give samme
// resultat hver gang), så tiden ligger i state og opdateres af en timer.
export function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
