import Image from "next/image";
import { objectSrc } from "@/lib/categories";
import styles from "./table-objects.module.css";

// "Bordet" (retning B): turens ting som 3D-objekter på et bord.
// Bygges ud fra udgifterne, så det altid passer med data.
// Pynt (alt=""): antallet og navnene står som tekst andre steder.
export function TableObjects({ expenses }) {
  return (
    <div className={styles.table}>
      <ul className={styles.objects}>
        {expenses.map((e, i) => (
          <li key={e.id} style={{ "--i": i }} className={styles.object}>
            <Image src={objectSrc(e.category)} alt="" width={84} height={84} />
          </li>
        ))}
      </ul>
    </div>
  );
}
