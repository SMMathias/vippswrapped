import styles from "./states.module.css";

// Loading: role="status" læses op af skærmlæsere uden at afbryde.
export function LoadingState({ label = "Henter turen …" }) {
  return (
    <div className={styles.state} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden="true" />
      <p className="text-body-md">{label}</p>
    </div>
  );
}

// Fejl: role="alert" læses op med det samme. Beskeden er altid på dansk.
export function ErrorState({ message, onRetry }) {
  return (
    <div className={styles.state} role="alert">
      <p className="text-heading-sm">Noget gik galt</p>
      <p className={`text-body-md ${styles.secondary}`}>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-primary" onClick={onRetry}>
          Prøv igen
        </button>
      )}
    </div>
  );
}

// Tom tilstand: forklarer, hvad der mangler, og hvad man kan gøre.
export function EmptyState({ title, children }) {
  return (
    <div className={styles.empty}>
      <p className="text-label-lg">{title}</p>
      {/* Ikke sekundær grå her: #76767B på #F2F2F4 er kun ca. 4,0:1 (under WCAG AA). */}
      {children && <p className="text-body-md">{children}</p>}
    </div>
  );
}
