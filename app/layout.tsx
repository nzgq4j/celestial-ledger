import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Celestial Ledger — Personal Natal Chart",
  description: "A privacy-conscious Western tropical natal chart calculator with deterministic astronomical calculations."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
