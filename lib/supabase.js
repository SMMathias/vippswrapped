import { createClient } from "@supabase/supabase-js";

// Den publishable key er offentlig: den giver kun læseadgang og adgang til
// RPC-funktionerne (se Supabase-opsætning i vaulten). Service role-nøglen
// må aldrig ligge her eller i repoet.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Mangler NEXT_PUBLIC_SUPABASE_URL eller NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Tjek .env.local (lokalt) eller Environment Variables (Vercel)."
  );
}

// Intet login, så sessionen skal hverken gemmes eller fornyes.
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Der er kun én tur i databasen: demo-turen.
export const TRIP_SLUG = "berlin";
