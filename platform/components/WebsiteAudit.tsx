import Ring from "@/components/Ring";
import type { WebsiteAudit as Audit, AuditAxis } from "@/lib/website-audit";

function LeanBar({ lean, label }: { lean: number; label: string }) {
  const pos = ((lean + 100) / 200) * 100; // -100..100 → 0..100%
  return (
    <div style={{ marginTop: 10 }}>
      <div className="lean-bar">
        <span className="lean-marker" style={{ left: `calc(${pos}% - 6px)` }} />
      </div>
      <div className="lean-scale">
        <span>vrouwelijk</span>
        <span>gebalanceerd</span>
        <span>mannelijk</span>
      </div>
      <p className="muted small" style={{ marginTop: 4, marginBottom: 0 }}>
        Toon: <strong style={{ color: "var(--ink)" }}>{label}</strong>
      </p>
    </div>
  );
}

function Axis({ title, axis, note }: { title: string; axis: AuditAxis; note?: string }) {
  return (
    <div className="glass-sm" style={{ flex: "1 1 280px" }}>
      <div className="kicker" style={{ color: "var(--sky)" }}>{title}</div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 6 }}>
        <Ring pct={axis.inclusivity} size={84} />
        <div>
          <p style={{ fontFamily: "'Sora', sans-serif", fontWeight: 600, marginBottom: 2 }}>
            Inclusiviteit {axis.inclusivity}%
          </p>
          {note && <p className="muted small" style={{ marginBottom: 0 }}>{note}</p>}
        </div>
      </div>
      <LeanBar lean={axis.lean} label={axis.leanLabel} />
      {axis.summary && <p style={{ marginTop: 12, lineHeight: 1.6 }}>{axis.summary}</p>}
      {axis.evidence.length > 0 && (
        <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
          {axis.evidence.map((e, i) => (
            <li key={i} className="muted small" style={{ marginBottom: 4, lineHeight: 1.5 }}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function WebsiteAudit({ audit }: { audit: Audit }) {
  return (
    <>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <Axis title="Tekst" axis={audit.text} />
        <Axis
          title="Beeld"
          axis={audit.visuals}
          note={
            audit.visuals.imagesAnalysed > 0
              ? `${audit.visuals.imagesAnalysed} beeld(en) bekeken`
              : "Geen beelden te analyseren"
          }
        />
      </div>
      {audit.overall && (
        <p style={{ marginTop: 18, lineHeight: 1.7 }}>
          <strong>Samengevat:</strong> {audit.overall}
        </p>
      )}
      <p className="muted small" style={{ marginTop: 8, marginBottom: 0 }}>
        Automatische analyse van <a href={audit.url} target="_blank" rel="noopener noreferrer">{audit.url} ↗</a> — tekst &amp; beeld.
      </p>
    </>
  );
}
