import Link from "next/link";
import { notFound } from "next/navigation";
import CopyContext from "@/components/CopyContext";
import { getReport, toMarkdownDigest } from "@/lib/library";
import { regionLabel, sectorLabel } from "@/lib/sectors";

export const dynamic = "force-dynamic";

export default async function ResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  const addedOn = report.addedAt ? report.addedAt.slice(0, 10) : null;

  return (
    <>
      <div className="page-label">Facilitator · Research library</div>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 12 }}>
        <a href={report.url} target="_blank" rel="noopener noreferrer">
          {report.title} ↗
        </a>
      </h1>
      <p className="sprint-meta" style={{ marginBottom: 12 }}>
        {report.organization ?? "Unknown organization"}
        {report.year !== null ? ` · ${report.year}` : ""}
        {report.language ? ` · ${report.language.toUpperCase()}` : ""}
      </p>
      <p style={{ marginBottom: 20 }}>
        <span className="badge badge-region">{regionLabel(report.region)}</span>{" "}
        <span className="badge badge-sector">{sectorLabel(report.sector)}</span>
        {report.topics.map((t) => (
          <span key={t} className="badge"> {t}</span>
        ))}
      </p>
      <p className="muted small" style={{ marginBottom: 32 }}>
        <Link href="/research">← Back to the library</Link>
      </p>

      {report.keyStats.length > 0 ? (
        <section className="glass-sm" style={{ marginBottom: 24 }} aria-label="Key stats">
          <div className="kicker" style={{ color: "var(--amber)" }}>Key stats</div>
          <ul className="key-stat-list">
            {report.keyStats.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="glass-sm" style={{ marginBottom: 24 }} aria-label="Quick read">
        <div className="kicker" style={{ color: "var(--sky)" }}>Quick read</div>
        <p className="prework-quote" style={{ fontStyle: "normal" }}>{report.excerpt}</p>
      </section>

      <section className="glass-sm" style={{ marginBottom: 24 }} aria-label="Source and AI context">
        <div className="kicker" style={{ color: "var(--mint)" }}>Use this report</div>
        <p style={{ marginBottom: 6 }}>
          Source:{" "}
          <a href={report.url} target="_blank" rel="noopener noreferrer" className="code">
            {report.url}
          </a>
        </p>
        {addedOn ? (
          <p className="muted small" style={{ marginBottom: 16 }}>Added to the library on {addedOn}.</p>
        ) : (
          <p style={{ marginBottom: 16 }} />
        )}
        <div className="btn-row">
          <CopyContext text={toMarkdownDigest([report], new Date())} label="Copy as AI context" />
          <span className="muted small">
            Markdown digest of this report — paste it straight into an AI conversation.
          </span>
        </div>
      </section>
    </>
  );
}
