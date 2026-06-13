// The Prism brand mark — copied verbatim from sprint/03_proposition-deck.html.
// Rendered via dangerouslySetInnerHTML so the SVG stays byte-identical to the deck.
const PRISM_SVG = `<svg viewBox="0 0 420 150" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="pmFace" x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
            <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.45"/>
            <stop offset="1" stop-color="#ffffff" stop-opacity="0.7"/>
          </linearGradient>
          <linearGradient id="pmSide" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#0D3B2E" stop-opacity="0.34"/>
            <stop offset="1" stop-color="#0D3B2E" stop-opacity="0.08"/>
          </linearGradient>
          <linearGradient id="pmRose" gradientUnits="userSpaceOnUse" x1="168" y1="0" x2="402" y2="0">
            <stop offset="0" stop-color="#F5B896"/><stop offset="1" stop-color="#F5B896" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="pmAmber" gradientUnits="userSpaceOnUse" x1="176" y1="0" x2="406" y2="0">
            <stop offset="0" stop-color="#F2D080"/><stop offset="1" stop-color="#F2D080" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="pmMint" gradientUnits="userSpaceOnUse" x1="184" y1="0" x2="406" y2="0">
            <stop offset="0" stop-color="#9FD4B0"/><stop offset="1" stop-color="#9FD4B0" stop-opacity="0"/>
          </linearGradient>
          <linearGradient id="pmSky" gradientUnits="userSpaceOnUse" x1="191" y1="0" x2="400" y2="0">
            <stop offset="0" stop-color="#6DC0C8"/><stop offset="1" stop-color="#6DC0C8" stop-opacity="0"/>
          </linearGradient>
          <filter id="pmBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
        </defs>
        <!-- ground shadow -->
        <ellipse cx="152" cy="132" rx="62" ry="7" fill="#0D3B2E" opacity="0.14" filter="url(#pmBlur)"/>
        <!-- spectrum beams, emerging from behind the glass and fading out -->
        <polygon fill="url(#pmRose)"  points="168,57 168,63 402,33 402,21"/>
        <polygon fill="url(#pmAmber)" points="176,70 176,76 406,66 406,54"/>
        <polygon fill="url(#pmMint)"  points="184,83 184,89 406,99 406,87"/>
        <polygon fill="url(#pmSky)"   points="191,95 191,101 400,131 400,119"/>
        <!-- extruded side face (depth) -->
        <polygon fill="url(#pmSide)" points="150,16 166,7 220,103 204,114" stroke="rgba(255,255,255,0.5)" stroke-width="1" stroke-linejoin="round"/>
        <!-- front glass face -->
        <path d="M150,16 L204,114 L96,114 Z" fill="url(#pmFace)" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linejoin="round"/>
        <!-- highlight streak -->
        <line x1="143" y1="34" x2="116" y2="82" stroke="#ffffff" stroke-opacity="0.85" stroke-width="3" stroke-linecap="round"/>
      </svg>`;

export default function PrismMark({ className = "prism-mark" }: { className?: string }) {
  return (
    <span
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PRISM_SVG }}
    />
  );
}
