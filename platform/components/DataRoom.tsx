import { db, ensureSchema } from "@/lib/db";
import type { DocStatus } from "@/lib/analyze-doc";

interface DocRow {
  id: string;
  filename: string;
  sizeBytes: number | null;
  uploadedBy: string | null;
  excerpt: string | null;
  keyStats: string[];
  relevance: string | null;
  status: DocStatus;
  createdAt: string | null;
}

const STATUS_BADGE: Record<DocStatus, { label: string; color: string; bg: string }> = {
  analyzed: { label: "Analyzed", color: "#1e6b4f", bg: "rgba(159,212,176,0.35)" },
  pending_ai: { label: "Awaiting AI", color: "#8a6d3b", bg: "rgba(242,208,128,0.3)" },
  extract_failed: { label: "Stored — not readable", color: "#a05a3a", bg: "rgba(245,184,150,0.35)" },
};

function formatSize(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function parseKeyStats(raw: unknown): string[] {
  if (raw == null) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Facilitator-facing data room: every uploaded document with its AI quick
 * read, plus a facilitator upload form. Async server component — the
 * dashboard page renders <DataRoom sprintId={id} /> wherever it fits.
 */
export default async function DataRoom({ sprintId }: { sprintId: string }) {
  await ensureSchema();
  const res = await db().execute({
    sql: `SELECT id, filename, size_bytes, uploaded_by, excerpt, key_stats, relevance, status, created_at
          FROM documents WHERE sprint_id = ? ORDER BY created_at DESC`,
    args: [sprintId],
  });

  const docs: DocRow[] = res.rows.map((r) => ({
    id: String(r.id),
    filename: String(r.filename),
    sizeBytes: r.size_bytes == null ? null : Number(r.size_bytes),
    uploadedBy: r.uploaded_by == null ? null : String(r.uploaded_by),
    excerpt: r.excerpt == null ? null : String(r.excerpt),
    keyStats: parseKeyStats(r.key_stats),
    relevance: r.relevance == null ? null : String(r.relevance),
    status: (r.status === "analyzed" || r.status === "pending_ai" || r.status === "extract_failed"
      ? r.status
      : "pending_ai") as DocStatus,
    createdAt: r.created_at == null ? null : String(r.created_at),
  }));

  return (
    <section className="glass">
      <div className="kicker" style={{ color: "var(--rose)" }}>Data room</div>

      {docs.length === 0 ? (
        <p className="muted" style={{ marginBottom: 20 }}>
          No documents yet — the client intake page has the upload box.
        </p>
      ) : (
        <div style={{ display: "grid", gap: 18, marginBottom: 24 }}>
          {docs.map((doc) => {
            const badge = STATUS_BADGE[doc.status];
            const meta = [
              doc.uploadedBy ? `by ${doc.uploadedBy}` : null,
              formatSize(doc.sizeBytes) || null,
              formatDate(doc.createdAt) || null,
            ].filter(Boolean);
            return (
              <div
                key={doc.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.7)",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                  <a
                    href={`/dashboard/${sprintId}/documents/${doc.id}`}
                    style={{ fontWeight: 600, color: "var(--ink)" }}
                  >
                    {doc.filename}
                  </a>
                  <span className="muted small">{meta.join(" · ")}</span>
                  <span
                    className="small"
                    style={{
                      padding: "1px 10px",
                      borderRadius: 999,
                      fontWeight: 600,
                      color: badge.color,
                      background: badge.bg,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
                {doc.excerpt && (
                  <p style={{ margin: "10px 0 0", lineHeight: 1.6 }}>{doc.excerpt}</p>
                )}
                {doc.keyStats.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                    {doc.keyStats.map((stat, i) => (
                      <span
                        key={i}
                        className="small"
                        style={{
                          padding: "2px 10px",
                          borderRadius: 999,
                          background: "rgba(109,192,200,0.18)",
                          border: "1px solid rgba(109,192,200,0.4)",
                        }}
                      >
                        {stat}
                      </span>
                    ))}
                  </div>
                )}
                {doc.relevance && (
                  <p className="muted small" style={{ margin: "10px 0 0", lineHeight: 1.5 }}>
                    {doc.relevance}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form
        action={`/dashboard/${sprintId}/upload`}
        method="post"
        encType="multipart/form-data"
      >
        <input type="hidden" name="form" value="1" />
        <div className="btn-row">
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.pptx,.docx,.txt,.md,.csv"
            style={{ fontSize: "0.9rem" }}
          />
          <button type="submit" className="btn btn-secondary">Upload document</button>
          <span className="muted small">Max 4 MB · pdf, pptx, docx, txt, md, csv</span>
        </div>
      </form>
    </section>
  );
}
