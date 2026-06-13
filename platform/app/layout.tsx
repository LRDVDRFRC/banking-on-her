import type { Metadata } from "next";
import PrismMark from "@/components/PrismMark";
import FacilitatorNav from "@/components/FacilitatorNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unlockt · Gender Capital Lab™ Sprint",
  description: "Internal sprint platform — Unlockt Gender Capital Lab Sprint (local MVP).",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-header">
          <PrismMark />
          <div className="site-header-word">
            UNLOCKT <span>· Gender Capital Lab™ Sprint</span>
          </div>
          <FacilitatorNav />
        </header>
        <main className="page">{children}</main>
        <footer className="site-footer">
          Unlockt internal — facilitator access only. Client links (/s/…) are
          token-gated per sprint.
        </footer>
      </body>
    </html>
  );
}
