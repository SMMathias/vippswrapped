import styles from "./avatar.module.css";

// Initialer som i Vipps: de to første bogstaver ("DI", "LA").
// aria-hidden, fordi navnet altid står ved siden af.
export function Avatar({ name }) {
  return (
    <span className={`text-label-md ${styles.avatar}`} aria-hidden="true">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
