export function HoradricBackdrop() {
  return (
    <svg
      aria-hidden
      className="fixed inset-0 w-full h-full opacity-[0.06] pointer-events-none z-0"
      viewBox="0 0 800 800"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="800" height="800" fill="url(#grid)" className="text-gold" />
      {/* Outer hexagram */}
      <g stroke="currentColor" strokeWidth="0.8" fill="none" className="text-gold">
        <polygon points="400,80 660,240 660,560 400,720 140,560 140,240" />
        <polygon points="400,160 580,280 580,520 400,640 220,520 220,280" />
        <circle cx="400" cy="400" r="220" />
        <circle cx="400" cy="400" r="160" />
        <circle cx="400" cy="400" r="90" />
        {/* Triangles forming hexagram */}
        <polygon points="400,180 600,540 200,540" />
        <polygon points="400,620 200,260 600,260" />
        {/* Radial spokes */}
        <line x1="400" y1="80" x2="400" y2="720" />
        <line x1="140" y1="240" x2="660" y2="560" />
        <line x1="660" y1="240" x2="140" y2="560" />
        {/* Marginal glyphs */}
        <circle cx="400" cy="400" r="18" />
        <text x="400" y="405" textAnchor="middle" fontSize="22" fontFamily="serif" fill="currentColor">
          ⚔
        </text>
      </g>
    </svg>
  );
}
