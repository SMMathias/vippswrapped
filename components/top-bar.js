import Link from "next/link";
import { BackIcon } from "./icons";
import styles from "./top-bar.module.css";

// Topbar som i Vipps: tilbage-pil til venstre, titel i midten.
export function TopBar({ title, backHref = "/", backLabel = "Tilbage til turen" }) {
  return (
    <header className={styles.topbar}>
      <Link href={backHref} className={styles.back}>
        <BackIcon />
        <span className="visually-hidden">{backLabel}</span>
      </Link>
      <h1 className="text-heading-sm">{title}</h1>
    </header>
  );
}
