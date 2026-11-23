import Link from "next/link";
import { bannerState } from "@/lib/status";
import { LockIcon } from "./icons";
import styles from "./wrapped-banner.module.css";

// Banneret fra C: viser fra start, at Wrapped åbner, når alle har betalt (H2).
// Kan ikke lukkes. Lås-ikon + tekst, så farven ikke står alene.
// aria-live="polite": skærmlæsere får skiftet at vide, fx når nogen betaler.
export function WrappedBanner({ trip }) {
  const { locked, text, href, cta } = bannerState(trip);

  const content = (
    <>
      <span className={styles.icon}>
        <LockIcon open={!locked} />
      </span>
      <span className={`text-label-lg ${styles.text}`}>{text}</span>
      {cta && <span className={`text-label-md ${styles.cta}`}>{cta}</span>}
    </>
  );

  return (
    <div aria-live="polite" className={styles.wrapper}>
      {href ? (
        <Link href={href} className={`${styles.banner} ${locked ? "" : styles.open}`}>
          {content}
        </Link>
      ) : (
        <p className={styles.banner}>{content}</p>
      )}
    </div>
  );
}
