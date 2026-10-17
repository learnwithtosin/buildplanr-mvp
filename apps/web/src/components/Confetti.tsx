"use client";

const COLORS = ["#16bfcc", "#f2b84b", "#0b3b40", "#ecdfb9", "#5fd6df"] as const;
const PIECES = 36;

/** Deterministic 0..1 value per piece and property, so render stays pure. */
function rand(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const PIECE_LAYOUT = Array.from({ length: PIECES }, (_, i) => ({
  id: i,
  left: rand(i, 1) * 100,
  color: COLORS[i % COLORS.length],
  delay: rand(i, 2) * 0.6,
  duration: 2.6 + rand(i, 3) * 1.8,
  drift: (rand(i, 4) - 0.5) * 220,
  spin: 360 + rand(i, 5) * 540,
}));

/**
 * One-off celebration when a plan finishes. Pure CSS animation (see
 * `.confetti-piece` in globals.css), so it costs nothing after it ends and
 * is hidden entirely for people who prefer reduced motion.
 */
export default function Confetti() {
  return (
    <div aria-hidden="true">
      {PIECE_LAYOUT.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              "--delay": `${p.delay}s`,
              "--dur": `${p.duration}s`,
              "--drift": `${p.drift}px`,
              "--spin": `${p.spin}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
