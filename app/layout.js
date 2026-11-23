import { Inter } from "next/font/google";
import "./tokens.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Vipps Wrapped",
  description: "Studieprojekt på EAAA uden tilknytning til Vipps.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="da" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
