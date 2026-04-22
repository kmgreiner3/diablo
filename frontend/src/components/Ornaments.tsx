export function CornerFlourish({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M 4 56 L 4 20 Q 4 4 20 4 L 56 4" />
        <path d="M 10 50 L 10 26 Q 10 10 26 10 L 50 10" opacity="0.5" />
        <circle cx="10" cy="50" r="1.5" fill="currentColor" />
        <circle cx="50" cy="10" r="1.5" fill="currentColor" />
        <path d="M 18 8 Q 22 2 28 6" />
        <path d="M 8 18 Q 2 22 6 28" />
      </g>
    </svg>
  );
}

export function DecorativeDivider() {
  return (
    <div className="flex items-center gap-3 my-6 text-gold/70">
      <div className="flex-1 rule-gold" />
      <svg viewBox="0 0 40 12" className="w-10 h-3" aria-hidden>
        <path
          d="M 0 6 L 14 6 M 26 6 L 40 6 M 20 2 L 16 6 L 20 10 L 24 6 Z"
          stroke="currentColor"
          strokeWidth="1"
          fill="currentColor"
          fillOpacity="0.6"
        />
      </svg>
      <div className="flex-1 rule-gold" />
    </div>
  );
}

export function IlluminatedNumber({ n }: { n: number }) {
  const roman = toRoman(n);
  return (
    <span className="inline-flex items-center justify-center font-display text-gold-bright text-4xl italic tracking-wide leading-none">
      {roman}
    </span>
  );
}

function toRoman(n: number): string {
  const map: [number, string][] = [
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let v = n;
  for (const [val, sym] of map) {
    while (v >= val) { out += sym; v -= val; }
  }
  return out;
}
