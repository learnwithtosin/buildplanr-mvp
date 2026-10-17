/**
 * Flat, chunky illustrations used across the app. Every shape is drawn
 * twice — a dark offset copy underneath, the coloured shape on top — which
 * is what gives them their raised, printed look. Colours come from the
 * tokens in globals.css so they stay in step with the rest of the UI.
 */

const DEEP = "var(--color-deep)";
const KRAFT = "var(--color-kraft)";
const KRAFT_DEEP = "var(--color-kraft-deep)";
const TEAL = "var(--color-teal-500)";
const GOLD = "var(--color-marigold)";

interface IllustrationProps {
  className?: string;
}

/** Four-point sparkle, centred on 0,0. */
const SPARKLE =
  "M0,-16 C2,-5 5,-2 16,0 C5,2 2,5 0,16 C-2,5 -5,2 -16,0 C-5,-2 -2,-5 0,-16Z";

/** Five-point star, centred on 0,0 (outer radius 30). */
const STAR =
  "M0,-30 L7.64,-10.52 L28.53,-9.27 L12.36,4.02 L17.63,24.27 L0,13 L-17.63,24.27 L-12.36,4.02 L-28.53,-9.27 L-7.64,-10.52Z";

/** A notepad with a lightbulb: "describe your idea". */
export function IdeaIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <ellipse cx="120" cy="184" rx="78" ry="9" fill="var(--color-line)" />

      {/* notepad */}
      <rect x="48" y="62" width="118" height="108" rx="12" fill={DEEP} transform="translate(7 7)" />
      <rect x="48" y="62" width="118" height="108" rx="12" fill={KRAFT} />
      <rect x="48" y="62" width="118" height="22" rx="12" fill={TEAL} />
      <rect x="48" y="74" width="118" height="10" fill={TEAL} />
      <circle cx="74" cy="73" r="4" fill={DEEP} />
      <circle cx="107" cy="73" r="4" fill={DEEP} />
      <circle cx="140" cy="73" r="4" fill={DEEP} />
      <g stroke={DEEP} strokeWidth="5" strokeLinecap="round">
        <line x1="66" y1="102" x2="146" y2="102" />
        <line x1="66" y1="120" x2="132" y2="120" />
        <line x1="66" y1="138" x2="114" y2="138" />
      </g>

      {/* check badge */}
      <circle cx="150" cy="148" r="20" fill={DEEP} transform="translate(4 4)" />
      <circle cx="150" cy="148" r="20" fill={GOLD} />
      <path
        d="M141 148 l7 7 l13 -14"
        fill="none"
        stroke={DEEP}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* bulb */}
      <g className="animate-bob" style={{ transformOrigin: "182px 52px" }}>
        <circle cx="182" cy="52" r="26" fill={DEEP} transform="translate(5 5)" />
        <circle cx="182" cy="52" r="26" fill={GOLD} />
        <rect x="172" y="74" width="20" height="14" rx="4" fill={DEEP} />
        <path
          d="M174 52 q4 -12 14 -8"
          fill="none"
          stroke="#fff"
          strokeOpacity="0.7"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <g stroke={DEEP} strokeWidth="4" strokeLinecap="round">
          <line x1="182" y1="12" x2="182" y2="6" />
          <line x1="212" y1="24" x2="217" y2="19" />
          <line x1="152" y1="24" x2="147" y2="19" />
        </g>
      </g>
    </svg>
  );
}

/** A fanned stack of question cards: "answer a few questions". */
export function QuestionsIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <ellipse cx="120" cy="184" rx="78" ry="9" fill="var(--color-line)" />

      {/* back card */}
      <g transform="rotate(-9 100 110)">
        <rect x="50" y="40" width="102" height="134" rx="12" fill={DEEP} transform="translate(6 6)" />
        <rect x="50" y="40" width="102" height="134" rx="12" fill={TEAL} />
      </g>
      {/* middle card */}
      <g transform="rotate(7 130 110)">
        <rect x="78" y="34" width="102" height="134" rx="12" fill={DEEP} transform="translate(6 6)" />
        <rect x="78" y="34" width="102" height="134" rx="12" fill={KRAFT_DEEP} />
      </g>
      {/* front card */}
      <g className="animate-bob" style={{ transformOrigin: "120px 100px" }}>
        <rect x="66" y="30" width="108" height="140" rx="12" fill={DEEP} transform="translate(7 7)" />
        <rect x="66" y="30" width="108" height="140" rx="12" fill={KRAFT} />
        <g transform="translate(120 74)">
          <path d={SPARKLE} fill={DEEP} transform="scale(1.7)" />
        </g>
        <g stroke={DEEP} strokeWidth="5" strokeLinecap="round">
          <line x1="86" y1="122" x2="154" y2="122" />
          <line x1="86" y1="140" x2="130" y2="140" />
        </g>
      </g>

      {/* answered tick */}
      <circle cx="186" cy="48" r="17" fill={DEEP} transform="translate(4 4)" />
      <circle cx="186" cy="48" r="17" fill={GOLD} />
      <path
        d="M178 48 l6 6 l11 -12"
        fill="none"
        stroke={DEEP}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** A finished plan with a rising bar chart and star: "download your plan". */
export function PlanIllustration({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden="true">
      <ellipse cx="120" cy="184" rx="86" ry="9" fill="var(--color-line)" />

      {/* page */}
      <path d="M52 40 h78 l26 26 v108 h-104z" fill={DEEP} transform="translate(7 7)" />
      <path d="M52 40 h78 l26 26 v108 h-104z" fill={KRAFT} />
      <path d="M130 40 v26 h26z" fill={KRAFT_DEEP} />
      <g stroke={DEEP} strokeWidth="5" strokeLinecap="round">
        <line x1="68" y1="64" x2="108" y2="64" />
        <line x1="68" y1="80" x2="92" y2="80" />
      </g>

      {/* bars */}
      <g>
        <rect x="68" y="136" width="18" height="30" rx="3" fill={DEEP} transform="translate(3 3)" />
        <rect x="68" y="136" width="18" height="30" rx="3" fill={KRAFT_DEEP} />
        <rect x="94" y="118" width="18" height="48" rx="3" fill={DEEP} transform="translate(3 3)" />
        <rect x="94" y="118" width="18" height="48" rx="3" fill={TEAL} />
        <rect x="120" y="98" width="18" height="68" rx="3" fill={DEEP} transform="translate(3 3)" />
        <rect x="120" y="98" width="18" height="68" rx="3" fill={GOLD} />
      </g>

      {/* star */}
      <g className="animate-bob" style={{ transformOrigin: "176px 70px", ["--bob-rot" as string]: "6deg" }}>
        <g transform="translate(176 70)">
          <path d={STAR} fill={DEEP} transform="translate(4 4) scale(1.15)" stroke={DEEP} strokeWidth="6" strokeLinejoin="round" />
          <path d={STAR} fill={TEAL} transform="scale(1.15)" stroke={TEAL} strokeWidth="6" strokeLinejoin="round" />
          <path
            d="M-9 2 l7 7 l13 -15"
            fill="none"
            stroke={DEEP}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </g>
      <g transform="translate(214 108)">
        <path d={SPARKLE} fill={GOLD} stroke={DEEP} strokeWidth="2.5" strokeLinejoin="round" transform="scale(0.8)" />
      </g>
      <g transform="translate(36 112)">
        <path d={SPARKLE} fill={DEEP} transform="scale(0.55)" />
      </g>
    </svg>
  );
}

/** Small BuildPlanr mark: a stack of two pages with a teal corner. */
export function LogoMark({ className }: IllustrationProps) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="5" y="4" width="20" height="24" rx="4" fill={DEEP} transform="translate(3 2)" />
      <rect x="5" y="4" width="20" height="24" rx="4" fill={KRAFT} />
      <rect x="5" y="4" width="20" height="8" rx="4" fill={TEAL} />
      <rect x="5" y="8" width="20" height="4" fill={TEAL} />
      <g stroke={DEEP} strokeWidth="2.4" strokeLinecap="round">
        <line x1="10" y1="18" x2="20" y2="18" />
        <line x1="10" y1="23" x2="16" y2="23" />
      </g>
    </svg>
  );
}
