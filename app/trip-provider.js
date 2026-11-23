"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { fetchTrip, readErrorMessage } from "@/lib/trip";

// Turen hentes i klienten, fordi demo-turen er fælles og ændres hele tiden
// (alle med linket kan dele, betale og nulstille). Der er derfor intet at cache.
// Provideren ligger i layoutet, så turen kun hentes én gang og deles af alle skærme.
const TripContext = createContext(null);

export function TripProvider({ children }) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Id på den udgift, der lige er tilføjet. Gruppeskærmen bruger det til at
  // vise en bekræftelse og lade tingen "lande" på bordet.
  const [lastAddedId, setLastAddedId] = useState(null);

  // Henter turen og lægger svaret i state. State sættes først i callbacks,
  // når svaret er kommet, og ikke direkte i effekten.
  const load = useCallback(
    () =>
      fetchTrip()
        .then((next) => {
          setTrip(next);
          setError(null);
        })
        .catch((err) => setError(readErrorMessage(err)))
        .finally(() => setLoading(false)),
    []
  );

  // Første hentning, når siden åbnes.
  useEffect(() => {
    load();
  }, [load]);

  // Kaldes efter hver handling (del, betal, ryk, nulstil), så skærmen viser
  // det, der står i databasen. Gamle data bliver stående, mens der hentes.
  const reload = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  return (
    <TripContext.Provider
      value={{ trip, loading, error, reload, lastAddedId, setLastAddedId }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  const value = useContext(TripContext);
  if (!value) throw new Error("useTrip skal bruges inden i <TripProvider>.");
  return value;
}
