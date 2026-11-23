"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { rpcErrorMessage } from "@/lib/trip";
import { useTrip } from "./trip-provider";

// Fælles måde at kalde en RPC-funktion på (betal, ryk, afslut, nulstil):
// 1) marker handlingen som i gang (så knappen kan vise "Betaler …")
// 2) kald funktionen i Supabase
// 3) vis en dansk fejl, hvis det gik galt
// 4) hent turen igen, så skærmen viser det, der står i databasen
export function useRpc() {
  const { reload } = useTrip();
  const [busy, setBusy] = useState(null); // nøgle for den handling, der kører
  const [error, setError] = useState(null);

  async function run(key, fn, args, fallback) {
    setBusy(key);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc(fn, args);
    if (rpcError) setError(rpcErrorMessage(rpcError, fallback));
    await reload();
    setBusy(null);
    return { ok: !rpcError, data };
  }

  return { run, busy, error };
}
