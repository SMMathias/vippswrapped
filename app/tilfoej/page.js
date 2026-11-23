"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTrip } from "../trip-provider";
import { supabase } from "@/lib/supabase";
import { rpcErrorMessage } from "@/lib/trip";
import { matchCategory, objectSrc } from "@/lib/categories";
import { splitEvenly } from "@/lib/split";
import { formatDateTime, formatKr } from "@/lib/format";
import { Avatar } from "@/components/avatar";
import { TopBar } from "@/components/top-bar";
import { EmptyState, ErrorState, LoadingState } from "@/components/states";
import styles from "./page.module.css";

// "Vælg fra seneste køb": simuleret bankkobling. Dine seneste køb kommer fra
// tabellen recent_purchases, og et køb gøres til en delt udgift med RPC'en
// share_purchase. Fordelingen er lige, som i Vipps' standard.
export default function AddExpensePage() {
  const { trip, loading, error, reload } = useTrip();

  return (
    <main className={styles.page}>
      <TopBar title="Tilføj udgift" />

      {!trip && loading && <LoadingState />}
      {!trip && !loading && <ErrorState message={error} onRetry={reload} />}
      {trip && <SharePurchaseForm trip={trip} />}
    </main>
  );
}

function SharePurchaseForm({ trip }) {
  const router = useRouter();
  const { reload, setLastAddedId } = useTrip();

  const [purchaseId, setPurchaseId] = useState(null);
  // Alle er slået til fra start, fordi det er det mest almindelige.
  const [memberIds, setMemberIds] = useState(() => trip.members.map((m) => m.id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Kun køb, der ikke er delt endnu (expense_id er tom).
  const purchases = trip.recentPurchases.filter((p) => p.expense_id === null);
  const purchase = purchases.find((p) => p.id === purchaseId) ?? null;
  const selectedMembers = trip.members.filter((m) => memberIds.includes(m.id));
  const shares = purchase
    ? splitEvenly(purchase.amount, selectedMembers, purchase.member_id)
    : new Map();

  // Tomme tilstande
  if (trip.status !== "open") {
    return (
      <EmptyState title="Turen er afsluttet">
        Der kan ikke tilføjes flere udgifter, når opgørelsen er lavet.
      </EmptyState>
    );
  }
  if (purchases.length === 0) {
    return (
      <EmptyState title="Ingen nye køb">
        Alle dine seneste køb er allerede delt med gruppen.
      </EmptyState>
    );
  }

  function choosePurchase(id) {
    setPurchaseId(id);
    setError(null);
  }

  function toggleMember(id) {
    setMemberIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // Samme tjek som i databasen, så fejlen vises med det samme.
    if (!purchase) {
      setError("Vælg det køb, du vil dele.");
      return;
    }
    if (memberIds.length === 0) {
      setError("Vælg mindst én person at dele med.");
      return;
    }

    setSaving(true);
    setError(null);

    const { data: expenseId, error: rpcError } = await supabase.rpc("share_purchase", {
      p_purchase_id: purchase.id,
      p_member_ids: memberIds,
    });

    if (rpcError) {
      setError(
        rpcErrorMessage(rpcError, "Købet kunne ikke deles. Tjek din forbindelse, og prøv igen.")
      );
      setSaving(false);
      // Fx "Købet er allerede delt": hent turen igen, så listen passer.
      reload();
      return;
    }

    setLastAddedId(expenseId);
    await reload();
    router.push("/");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <fieldset className={styles.fieldset}>
        <legend className="text-heading-sm">Vælg fra seneste køb</legend>
        <p className={`text-body-md ${styles.secondary}`}>
          Køb fra din konto, som ikke er delt endnu.
        </p>
        <div className={styles.purchases}>
          {purchases.map((p) => (
            <label key={p.id} className={styles.purchase}>
              <input
                type="radio"
                name="purchase"
                value={p.id}
                checked={purchaseId === p.id}
                onChange={() => choosePurchase(p.id)}
                className={styles.radio}
              />
              <Image
                src={objectSrc(matchCategory(p.title, trip.categories))}
                alt=""
                width={48}
                height={48}
              />
              <span className={styles.purchaseText}>
                <span className="text-label-lg">{p.title}</span>
                <span className={`text-body-sm ${styles.secondary}`}>
                  {formatDateTime(p.purchased_at)}
                </span>
              </span>
              <span className="text-label-lg">{formatKr(p.amount)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {purchase && (
        <>
          {/* key: kortet bygges forfra, når man vælger et andet køb, så objektet popper igen (B03). */}
          <div className={styles.summary} key={purchase.id}>
            <Image
              src={objectSrc(matchCategory(purchase.title, trip.categories))}
              alt=""
              width={140}
              height={140}
              className={styles.pop}
            />
            <p className={`text-body-md ${styles.secondary}`}>Beløb at dele</p>
            <p className="text-display-md">{formatKr(purchase.amount)}</p>
            <p className="text-body-md">{purchase.title} · betalt af dig</p>
          </div>

          <fieldset className={styles.fieldset}>
            <legend className="text-heading-sm">Del med</legend>
            <p className={`text-body-md ${styles.secondary}`}>
              Beløbet deles lige mellem dem, der er slået til.
            </p>
            <ul className={styles.members}>
              {trip.members.map((m) => {
                const on = memberIds.includes(m.id);
                return (
                  <li key={m.id} className={styles.member}>
                    <Avatar name={m.name} />
                    <label htmlFor={`member-${m.id}`} className={styles.memberText}>
                      <span className="text-label-lg">{m.name}</span>
                      <span className={`text-body-sm ${styles.secondary}`}>
                        {on ? formatKr(shares.get(m.id)) : "Ikke med"}
                      </span>
                    </label>
                    <input
                      id={`member-${m.id}`}
                      type="checkbox"
                      role="switch"
                      checked={on}
                      onChange={() => toggleMember(m.id)}
                      className={styles.switch}
                    />
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </>
      )}

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={saving}>
          {saving ? "Deler …" : purchase ? `Del ${formatKr(purchase.amount)}` : "Del udgiften"}
        </button>
      </div>
    </form>
  );
}
