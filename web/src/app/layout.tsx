import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Approvals",
  description: "Travel request approvals demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            Travel Approvals
          </Link>
          <nav aria-label="Primary">
            <Link href="/requests/new">New request</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
