"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: [href: string, label: string][] = [
  ["/", "Sprints"],
  ["/research", "Research"],
  ["/research/ask", "Ask AI"],
];

/**
 * Header navigation for the facilitator side. Hidden on client-facing pages
 * (/s/<token>/…) — the crew should never see links into the protected area.
 */
export default function FacilitatorNav() {
  const pathname = usePathname();
  if (pathname.startsWith("/s/")) return null;

  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    if (href === "/research") return pathname === "/research" || /^\/research\/(?!ask)/.test(pathname);
    return pathname === href;
  }

  return (
    <nav
      className="no-print"
      aria-label="Facilitator navigation"
      style={{ marginLeft: "auto", display: "flex", gap: 22, alignItems: "center" }}
    >
      {LINKS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: "0.82rem",
            fontWeight: isActive(href) ? 700 : 500,
            letterSpacing: "0.04em",
            color: "var(--ink)",
            opacity: isActive(href) ? 1 : 0.6,
            textDecoration: "none",
            borderBottom: isActive(href) ? "2px solid var(--sky)" : "2px solid transparent",
            paddingBottom: 2,
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
