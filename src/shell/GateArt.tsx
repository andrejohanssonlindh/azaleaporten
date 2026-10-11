// Själva porten: stenvalv täckt av azaleor med ett glödande portalljus.

const FLOWERS: [number, number, number][] = [
  [92, 214, 30], [118, 160, 32], [160, 116, 34], [210, 92, 36], [262, 92, 36], [312, 116, 34], [354, 160, 32], [380, 214, 30],
  [100, 270, 22], [372, 270, 22], [136, 132, 20], [336, 132, 20], [236, 76, 24],
];

export function GateArt({ open = false }: { open?: boolean }) {
  return (
    <svg class={`gate-art${open ? ' open' : ''}`} viewBox="0 0 472 500" role="img" aria-label="Azaleaporten – ett stenvalv fullt av rosa azaleor med ett glödande ljus">
      <defs>
        <radialGradient id="ga-glow" cx="50%" cy="60%" r="60%">
          <stop offset="0" stop-color="#fff9db" />
          <stop offset=".4" stop-color="#ffc9de" />
          <stop offset=".8" stop-color="#9775fa" />
          <stop offset="1" stop-color="#5f3dc4" />
        </radialGradient>
        <linearGradient id="ga-stone" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#6c5a8a" />
          <stop offset="1" stop-color="#3f3356" />
        </linearGradient>
      </defs>
      <ellipse cx="236" cy="478" rx="200" ry="16" fill="#000" opacity=".25" />
      <path d="M70 470V250a166 166 0 0 1 332 0v220z" fill="url(#ga-stone)" />
      <path d="M112 470V256a124 124 0 0 1 248 0v214z" class="ga-portal" fill="url(#ga-glow)" />
      <g class="ga-sparkles" fill="#fff">
        <circle cx="200" cy="300" r="3" /><circle cx="270" cy="250" r="2.5" /><circle cx="240" cy="380" r="2" />
        <circle cx="180" cy="420" r="2.5" /><circle cx="300" cy="350" r="3" /><circle cx="226" cy="210" r="2" />
      </g>
      <g fill="#2f9e44">
        <ellipse cx="78" cy="250" rx="30" ry="12" transform="rotate(-40 78 250)" />
        <ellipse cx="394" cy="250" rx="30" ry="12" transform="rotate(40 394 250)" />
        <ellipse cx="190" cy="78" rx="26" ry="10" transform="rotate(-15 190 78)" />
        <ellipse cx="284" cy="78" rx="26" ry="10" transform="rotate(15 284 78)" />
        <ellipse cx="96" cy="310" rx="24" ry="9" transform="rotate(-70 96 310)" />
        <ellipse cx="376" cy="310" rx="24" ry="9" transform="rotate(70 376 310)" />
      </g>
      {FLOWERS.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={i % 3 === 1 ? '#f06595' : '#e64980'} />
          <circle cx={x - r * 0.3} cy={y - r * 0.3} r={r * 0.55} fill="#faa2c1" />
          <circle cx={x} cy={y} r={r * 0.22} fill="#ffe066" />
        </g>
      ))}
      <rect x="52" y="462" width="368" height="22" rx="8" fill="#3f3356" />
    </svg>
  );
}
