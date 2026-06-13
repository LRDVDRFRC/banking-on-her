// Server-renderable phone mock. The AI-generated screen_html is self-contained
// (inline CSS, no external resources) and rendered in a sandboxed iframe via
// srcDoc, inside a simple phone bezel. `scale` shrinks the whole phone — the
// iframe always renders at the native 390×760 and is CSS-transformed, so the
// screen's own layout never reflows.

const SCREEN_W = 390;
const SCREEN_H = 760;

export default function PhoneFrame({ html, scale = 1 }: { html: string; scale?: number }) {
  const w = Math.round(SCREEN_W * scale);
  const h = Math.round(SCREEN_H * scale);
  const bezel = Math.max(8, Math.round(12 * scale));
  const radius = Math.round(44 * scale);

  return (
    <div
      style={{
        width: w + bezel * 2,
        background: "#101820",
        borderRadius: radius,
        padding: bezel,
        boxShadow: "0 18px 44px -16px rgba(13,59,46,0.45)",
        margin: "0 auto",
      }}
    >
      {/* speaker notch */}
      <div
        style={{
          width: Math.round(96 * scale),
          height: Math.max(4, Math.round(6 * scale)),
          borderRadius: 999,
          background: "rgba(255,255,255,0.25)",
          margin: `0 auto ${Math.max(5, Math.round(8 * scale))}px`,
        }}
      />
      <div
        style={{
          width: w,
          height: h,
          borderRadius: Math.max(10, radius - bezel),
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <iframe
          srcDoc={html}
          title="Prototype"
          sandbox="allow-scripts"
          style={{
            width: SCREEN_W,
            height: SCREEN_H,
            border: 0,
            display: "block",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
    </div>
  );
}
