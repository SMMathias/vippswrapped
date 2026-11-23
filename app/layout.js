import { Inter } from "next/font/google";
import "./tokens.css";
import "./globals.css";
import styles from "./layout.module.css";
import { TripProvider } from "./trip-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vipps Wrapped",
  description: "Studieprojekt på EAAA uden tilknytning til Vipps MobilePay.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="da" className={inter.variable}>
      <body>
        {/* Eksamenskrav: altid synligt, at det er et studieprojekt. Sticky, så den også ses ved scroll. */}
        <aside className={`text-caption-md ${styles.studyNote}`} aria-label="Om projektet">
          Studieprojekt på EAAA. Ikke tilknyttet Vipps MobilePay.
        </aside>
        <TripProvider>
          <div className={styles.app}>{children}</div>
        </TripProvider>
      </body>
    </html>
  );
}
