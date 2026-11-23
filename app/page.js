import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <h1 className="text-heading-lg">Vipps Wrapped</h1>
      <p className={`text-body-md ${styles.secondary}`}>
        Studieprojekt på EAAA uden tilknytning til Vipps.
      </p>
    </main>
  );
}
