import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Decomp Academy — Master MWCC GC/2.0",
  description:
    "Learn to decompile GameCube PowerPC assembly back into matching C, " +
    "powered by the authoritative Metrowerks CodeWarrior GC/2.0 compiler.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
