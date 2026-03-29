import Link from "next/link";
import type { Route } from "next";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { DividerFrame } from "@/components/ui/divider-frame";
import { getCtaAnalyticsAttributes } from "@/lib/analytics/events";
import { siteConfig } from "@/lib/site-config";

type DraftingHeroProps = {
  headline: string;
  subhead: string;
  capabilities: ReadonlyArray<{ title: string; index: string }>;
  primaryCta: { href: Route; label: string };
  secondaryCta: { href: Route; label: string };
};

export function DraftingHero({
  headline,
  subhead,
  capabilities,
  primaryCta,
  secondaryCta,
}: DraftingHeroProps) {
  return (
    <section className="hh-drafting-hero-section pb-10 pt-2 sm:pb-12">
      <Container size="wide">
        {/* Outer mounted-sheet frame */}
        <div className="hh-drafting-board relative overflow-hidden">
          {/* Corner registration marks */}
          <div className="hh-corner hh-corner--tl" aria-hidden="true" />
          <div className="hh-corner hh-corner--tr" aria-hidden="true" />
          <div className="hh-corner hh-corner--bl" aria-hidden="true" />
          <div className="hh-corner hh-corner--br" aria-hidden="true" />

          <div className="grid lg:grid-cols-[minmax(0,1.18fr)_minmax(18rem,0.62fr)]">
            {/* ── LEFT: Message column ── */}
            <div className="flex flex-col justify-between gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:px-10 lg:py-12">
              {/* Eyebrow / sheet label */}
              <DividerFrame
                label={siteConfig.name}
                detail={siteConfig.shortName}
              />

              {/* Headline block */}
              <div className="flex flex-1 flex-col justify-center gap-7">
                <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-[2.9rem] lg:text-[3.4rem] lg:leading-[1.03]">
                  {headline}
                </h1>

                <p className="max-w-md text-[0.92rem] leading-[1.72] text-muted">
                  {subhead}
                </p>

                {/* CTA row */}
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={primaryCta.href}
                    className={buttonVariants({ variant: "primary", size: "lg" })}
                    {...getCtaAnalyticsAttributes({
                      label: primaryCta.label,
                      destination: primaryCta.href,
                      location: "home-drafting-hero",
                    })}
                  >
                    {primaryCta.label}
                  </Link>
                  <Link
                    href={secondaryCta.href}
                    className={buttonVariants({ variant: "secondary", size: "lg" })}
                    {...getCtaAnalyticsAttributes({
                      label: secondaryCta.label,
                      destination: secondaryCta.href,
                      location: "home-drafting-hero",
                    })}
                  >
                    {secondaryCta.label}
                  </Link>
                </div>
              </div>

              {/* Footer annotation row */}
              <div className="flex items-center gap-4 border-t border-line pt-5">
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted">
                  Sheet&nbsp;01
                </span>
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[0.62rem] uppercase tracking-[0.28em] text-muted">
                  {new Date().getFullYear()}
                </span>
              </div>
            </div>

            {/* ── RIGHT: Drafting instrument panel ── */}
            <aside
              className="hh-drafting-panel relative flex flex-col overflow-hidden border-t border-line lg:border-l lg:border-t-0"
              aria-label="Core capabilities"
            >
              {/* SVG drafting arm geometry */}
              <DraftingArmSVG />

              {/* Indexed capability summary */}
              <div className="relative z-10 mt-auto border-t border-line bg-white/60 px-6 py-6 backdrop-blur-[2px] sm:px-7 sm:py-7">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.3em] text-accent">
                  Primary Scope
                </p>
                <ul className="mt-4 space-y-0">
                  {capabilities.map((cap) => (
                    <li
                      key={cap.index}
                      className="flex items-baseline gap-4 border-b border-line py-3 last:border-b-0 last:pb-0"
                    >
                      <span className="shrink-0 font-mono text-[0.6rem] tracking-[0.2em] text-line-ink">
                        {cap.index}
                      </span>
                      <span className="text-[0.82rem] font-medium leading-snug tracking-[-0.02em] text-foreground">
                        {cap.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SVG drafting-arm panel                                     */
/* ────────────────────────────────────────────────────────── */

function DraftingArmSVG() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 420 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── background grid wash ── */}
        <defs>
          <pattern
            id="fine-grid"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 18 0 L 0 0 0 18"
              fill="none"
              stroke="rgba(35,45,63,0.055)"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="room-grid"
            width="72"
            height="72"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 72 0 L 0 0 0 72"
              fill="none"
              stroke="rgba(35,45,63,0.085)"
              strokeWidth="0.6"
            />
          </pattern>
          <radialGradient id="panel-fade" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.42" />
          </radialGradient>
          <mask id="grid-fade">
            <rect width="420" height="520" fill="url(#grid-vignette)" />
          </mask>
          <linearGradient id="grid-vignette" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="65%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Grid fill */}
        <rect
          width="420"
          height="520"
          fill="url(#fine-grid)"
          mask="url(#grid-fade)"
          opacity="0.7"
        />
        <rect
          width="420"
          height="520"
          fill="url(#room-grid)"
          mask="url(#grid-fade)"
          opacity="0.5"
        />

        {/* ── Drafting machine arm: vertical rail ── */}
        {/* Vertical spine track */}
        <line
          x1="88"
          y1="0"
          x2="88"
          y2="520"
          stroke="rgba(35,45,63,0.12)"
          strokeWidth="1"
        />
        {/* Track tick marks */}
        {[40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440, 480].map(
          (y) => (
            <line
              key={y}
              x1="84"
              y1={y}
              x2="92"
              y2={y}
              stroke="rgba(35,45,63,0.18)"
              strokeWidth="0.8"
            />
          )
        )}
        {/* Half ticks */}
        {[60, 100, 140, 180, 220, 260, 300, 340, 380, 420, 460].map((y) => (
          <line
            key={`h-${y}`}
            x1="86"
            y1={y}
            x2="90"
            y2={y}
            stroke="rgba(35,45,63,0.1)"
            strokeWidth="0.6"
          />
        ))}

        {/* ── Pivot node on vertical rail ── */}
        <circle
          cx="88"
          cy="188"
          r="6"
          fill="white"
          stroke="rgba(35,45,63,0.28)"
          strokeWidth="0.8"
        />
        <circle cx="88" cy="188" r="2" fill="rgba(35,45,63,0.22)" />

        {/* ── Primary arm: diagonal from pivot ── */}
        {/* Arm body */}
        <line
          x1="88"
          y1="188"
          x2="318"
          y2="82"
          stroke="rgba(35,45,63,0.22)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Arm edge guide (parallel offset) */}
        <line
          x1="90"
          y1="193"
          x2="320"
          y2="87"
          stroke="rgba(35,45,63,0.07)"
          strokeWidth="0.7"
        />
        <line
          x1="86"
          y1="183"
          x2="316"
          y2="77"
          stroke="rgba(35,45,63,0.07)"
          strokeWidth="0.7"
        />

        {/* ── Arm tick marks ── */}
        {[0.2, 0.35, 0.5, 0.65, 0.8].map((t, i) => {
          const x1s = 88,
            y1s = 188,
            x2s = 318,
            y2s = 82;
          const dx = x2s - x1s,
            dy = y2s - y1s;
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = -dy / len,
            ny = dx / len;
          const cx = x1s + dx * t;
          const cy = y1s + dy * t;
          const tickLen = i === 2 ? 5 : 3;
          return (
            <line
              key={`arm-tick-${i}`}
              x1={cx + nx * tickLen}
              y1={cy + ny * tickLen}
              x2={cx - nx * tickLen}
              y2={cy - ny * tickLen}
              stroke="rgba(35,45,63,0.18)"
              strokeWidth="0.7"
            />
          );
        })}

        {/* ── Secondary arm: from end of primary arm ── */}
        <line
          x1="318"
          y1="82"
          x2="390"
          y2="212"
          stroke="rgba(35,45,63,0.15)"
          strokeWidth="1.1"
          strokeLinecap="round"
        />

        {/* ── End pivot nodes ── */}
        {/* Primary arm terminus */}
        <circle
          cx="318"
          cy="82"
          r="7"
          fill="white"
          stroke="rgba(35,45,63,0.28)"
          strokeWidth="0.8"
        />
        <circle cx="318" cy="82" r="2.5" fill="rgba(0,91,65,0.35)" />

        {/* Secondary arm terminus */}
        <circle
          cx="390"
          cy="212"
          r="5"
          fill="white"
          stroke="rgba(35,45,63,0.2)"
          strokeWidth="0.8"
        />
        <circle cx="390" cy="212" r="1.8" fill="rgba(35,45,63,0.2)" />

        {/* ── Reference cross at primary pivot ── */}
        <line
          x1="82"
          y1="188"
          x2="66"
          y2="188"
          stroke="rgba(35,45,63,0.12)"
          strokeWidth="0.7"
          strokeDasharray="2 2"
        />
        <line
          x1="88"
          y1="182"
          x2="88"
          y2="166"
          stroke="rgba(35,45,63,0.12)"
          strokeWidth="0.7"
          strokeDasharray="2 2"
        />

        {/* ── Horizontal rule line ── */}
        <line
          x1="88"
          y1="188"
          x2="420"
          y2="188"
          stroke="rgba(35,45,63,0.1)"
          strokeWidth="0.8"
          strokeDasharray="4 4"
        />

        {/* ── Vertical datum line from primary pivot to top ── */}
        <line
          x1="318"
          y1="82"
          x2="318"
          y2="0"
          stroke="rgba(35,45,63,0.08)"
          strokeWidth="0.7"
          strokeDasharray="3 3"
        />

        {/* ── Arc sweep (radius reference) ── */}
        <path
          d="M 88 188 m 160 0 a 160 160 0 0 0 -111 -114"
          stroke="rgba(35,45,63,0.09)"
          strokeWidth="0.8"
          fill="none"
          strokeDasharray="3 6"
        />

        {/* ── Corner margin marks ── */}
        <path
          d="M 14 0 L 14 14 L 0 14"
          stroke="rgba(35,45,63,0.2)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M 406 0 L 406 14 L 420 14"
          stroke="rgba(35,45,63,0.2)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M 14 520 L 14 506 L 0 506"
          stroke="rgba(35,45,63,0.2)"
          strokeWidth="0.8"
          fill="none"
        />
        <path
          d="M 406 520 L 406 506 L 420 506"
          stroke="rgba(35,45,63,0.2)"
          strokeWidth="0.8"
          fill="none"
        />

        {/* ── Technical annotation labels ── */}
        {/* Arm label */}
        <text
          x="192"
          y="122"
          fill="rgba(35,45,63,0.28)"
          fontSize="6"
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="0.08em"
          transform="rotate(-24.8 192 122)"
        >
          ARM — A
        </text>

        {/* Dimension annotation */}
        <text
          x="108"
          y="185"
          fill="rgba(35,45,63,0.22)"
          fontSize="5.5"
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="0.06em"
        >
          REF 01
        </text>

        {/* Horizontal rule annotation */}
        <text
          x="340"
          y="184"
          fill="rgba(35,45,63,0.18)"
          fontSize="5"
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="0.06em"
        >
          H.REF
        </text>

        {/* Scale note */}
        <text
          x="16"
          y="506"
          fill="rgba(35,45,63,0.22)"
          fontSize="5.5"
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="0.06em"
        >
          SCALE 1:1
        </text>

        {/* Sheet ref */}
        <text
          x="340"
          y="506"
          fill="rgba(35,45,63,0.22)"
          fontSize="5.5"
          fontFamily="'IBM Plex Mono', monospace"
          letterSpacing="0.06em"
          textAnchor="end"
        >
          SHT. 01
        </text>

        {/* Panel fade overlay */}
        <rect
          width="420"
          height="520"
          fill="url(#panel-fade)"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}
