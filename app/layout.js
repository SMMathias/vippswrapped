import { Inter } from "next/font/google";
import "./tokens.css";
import "./globals.css";
import styles from "./layout.module.css";
import { TripProvider } from "./trip-provider";
import MotionProvider from "@/components/MotionProvider";

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
      <head>
        {/* Performance (Lighthouse): åbn forbindelsen til Supabase, mens siden loader,
            så hentningen af turen ikke skal vente på DNS/TLS bagefter.
            crossOrigin "anonymous", fordi supabase-js henter med CORS og uden cookies. */}
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_SUPABASE_URL}
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* Eksamenskrav: altid synligt, at det er et studieprojekt. Sticky, så den også ses ved scroll. */}
        <aside className={`text-caption-md ${styles.studyNote}`} aria-label="Om projektet">
          Studieprojekt på EAAA. Ikke tilknyttet Vipps MobilePay.
        </aside>
        <TripProvider>
          <MotionProvider>
            <div className={styles.app}>{children}</div>
          </MotionProvider>
        </TripProvider>
      </body>
    </html>
  );
}
