"use client";

import { useEffect, useRef } from "react";

/* ────────────────────────────────────────────────────────── */
/* House geometry — each segment is a polyline of [x,y]      */
/* Drawn in architect order: foundation → walls → roof → details */
/* ────────────────────────────────────────────────────────── */
const SEGMENTS: [number, number][][] = [
  // Foundation
  [[135, 310], [365, 310]],
  // Left wall
  [[165, 310], [165, 190]],
  // Roof left slope
  [[165, 190], [255, 130]],
  // Roof right slope
  [[255, 130], [345, 190]],
  // Right wall
  [[345, 190], [345, 310]],
  // Door
  [[230, 310], [230, 250], [280, 250], [280, 310]],
  // Left window
  [[182, 208], [218, 208], [218, 245], [182, 245], [182, 208]],
  // Left window cross (vertical)
  [[200, 208], [200, 245]],
  // Left window cross (horizontal)
  [[182, 226], [218, 226]],
  // Right window
  [[292, 208], [328, 208], [328, 245], [292, 245], [292, 208]],
  // Right window cross (vertical)
  [[310, 208], [310, 245]],
  // Right window cross (horizontal)
  [[292, 226], [328, 226]],
];

/* ── Geometry helpers ── */

function polylineLength(pts: [number, number][]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function toPathD(pts: [number, number][]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
}

function pointAtFraction(pts: [number, number][], t: number): [number, number] {
  const total = polylineLength(pts);
  let target = t * total;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1];
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (target <= segLen) {
      const f = segLen > 0 ? target / segLen : 0;
      return [pts[i - 1][0] + dx * f, pts[i - 1][1] + dy * f];
    }
    target -= segLen;
  }
  return pts[pts.length - 1];
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* ── Inverse-kinematics for 2-link drafting arm ── */

const RAIL_X = 88;
const L1 = 180;
const L2 = 120;

function solveArm(tipX: number, tipY: number) {
  const pivotY = Math.max(60, Math.min(460, tipY - (tipX - RAIL_X) * 0.35));
  const dx = tipX - RAIL_X;
  const dy = tipY - pivotY;
  let d = Math.sqrt(dx * dx + dy * dy);
  d = Math.max(Math.abs(L1 - L2) + 2, Math.min(L1 + L2 - 2, d));

  const baseAngle = Math.atan2(dy, dx);
  const cosA2 = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
  const a2 = Math.acos(Math.max(-1, Math.min(1, cosA2)));
  const a1 =
    baseAngle - Math.atan2(L2 * Math.sin(a2), L1 + L2 * Math.cos(a2));

  return {
    pivotY,
    elbowX: RAIL_X + L1 * Math.cos(a1),
    elbowY: pivotY + L1 * Math.sin(a1),
  };
}

/* ── Pre-compute schedule ── */

const segLens = SEGMENTS.map(polylineLength);
const totalLen = segLens.reduce((a, b) => a + b, 0);
const GAP = 0.012;
const totalGaps = (SEGMENTS.length - 1) * GAP;
const drawFrac = 1 - totalGaps;

type Sched = { start: number; end: number };
const schedule: Sched[] = [];
{
  let cur = 0;
  for (let i = 0; i < SEGMENTS.length; i++) {
    const fraction = (segLens[i] / totalLen) * drawFrac;
    schedule.push({ start: cur, end: cur + fraction });
    cur += fraction + (i < SEGMENTS.length - 1 ? GAP : 0);
  }
}

/* ────────────────────────────────────────────────────────── */
/* Component                                                  */
/* ────────────────────────────────────────────────────────── */

export function DraftingArmAnimated() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const armRefs = useRef<Record<string, SVGElement | null>>({});
  const houseRef = useRef<SVGGElement>(null);
  const rafRef = useRef<number>(0);

  const setArmRef = (key: string) => (el: SVGElement | null) => {
    armRefs.current[key] = el;
  };

  useEffect(() => {
    // Respect reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      // Show house fully drawn, arm at rest
      pathRefs.current.forEach((p) => {
        if (p) p.style.strokeDashoffset = "0";
      });
      return;
    }

    // Init dashoffsets
    pathRefs.current.forEach((p) => {
      if (p) {
        const len = p.getTotalLength();
        p.style.strokeDasharray = `${len}`;
        p.style.strokeDashoffset = `${len}`;
      }
    });

    const DRAW_MS = 11000;
    const HOLD_MS = 2500;
    const FADE_MS = 1400;
    const RESET_MS = 1200;
    const CYCLE = DRAW_MS + HOLD_MS + FADE_MS + RESET_MS;

    const restTip = { x: 280, y: 230 };
    let start: number | null = null;

    function setAttr(key: string, attrs: Record<string, string>) {
      const el = armRefs.current[key];
      if (!el) return;
      for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    }

    function updateArm(tx: number, ty: number) {
      const { pivotY, elbowX, elbowY } = solveArm(tx, ty);

      setAttr("pivot", { cy: `${pivotY}` });
      setAttr("pivotDot", { cy: `${pivotY}` });
      setAttr("arm1", {
        x1: `${RAIL_X}`, y1: `${pivotY}`,
        x2: `${elbowX}`, y2: `${elbowY}`,
      });

      // Parallel edge lines
      const adx = elbowX - RAIL_X, ady = elbowY - pivotY;
      const al = Math.sqrt(adx * adx + ady * ady) || 1;
      const nx = (-ady / al) * 2.5, ny = (adx / al) * 2.5;
      setAttr("arm1e1", {
        x1: `${RAIL_X + nx}`, y1: `${pivotY + ny}`,
        x2: `${elbowX + nx}`, y2: `${elbowY + ny}`,
      });
      setAttr("arm1e2", {
        x1: `${RAIL_X - nx}`, y1: `${pivotY - ny}`,
        x2: `${elbowX - nx}`, y2: `${elbowY - ny}`,
      });

      setAttr("elbow", { cx: `${elbowX}`, cy: `${elbowY}` });
      setAttr("elbowDot", { cx: `${elbowX}`, cy: `${elbowY}` });
      setAttr("arm2", {
        x1: `${elbowX}`, y1: `${elbowY}`,
        x2: `${tx}`, y2: `${ty}`,
      });
      setAttr("tip", { cx: `${tx}`, cy: `${ty}` });
      setAttr("tipDot", { cx: `${tx}`, cy: `${ty}` });
    }

    function tick(ts: number) {
      if (!start) start = ts;
      const elapsed = (ts - start) % CYCLE;

      if (elapsed < DRAW_MS) {
        /* ── drawing ── */
        const progress = elapsed / DRAW_MS;
        let tipX = SEGMENTS[0][0][0], tipY = SEGMENTS[0][0][1];
        let found = false;

        for (let i = 0; i < SEGMENTS.length; i++) {
          const s = schedule[i];
          const p = pathRefs.current[i];

          if (progress < s.start) {
            if (p) p.style.strokeDashoffset = `${p.getTotalLength()}`;
            if (!found) {
              found = true;
              const prevEnd = i > 0 ? SEGMENTS[i - 1][SEGMENTS[i - 1].length - 1] : SEGMENTS[0][0];
              const ps = i > 0 ? schedule[i - 1].end : 0;
              const gf = s.start > ps ? easeInOutCubic(Math.max(0, Math.min(1, (progress - ps) / (s.start - ps)))) : 0;
              tipX = prevEnd[0] + (SEGMENTS[i][0][0] - prevEnd[0]) * gf;
              tipY = prevEnd[1] + (SEGMENTS[i][0][1] - prevEnd[1]) * gf;
            }
          } else if (progress >= s.end) {
            if (p) p.style.strokeDashoffset = "0";
            const e = SEGMENTS[i][SEGMENTS[i].length - 1];
            tipX = e[0]; tipY = e[1];
          } else {
            found = true;
            const sp = easeInOutCubic((progress - s.start) / (s.end - s.start));
            if (p) p.style.strokeDashoffset = `${p.getTotalLength() * (1 - sp)}`;
            const pos = pointAtFraction(SEGMENTS[i], sp);
            tipX = pos[0]; tipY = pos[1];
          }
        }

        updateArm(tipX, tipY);
        if (houseRef.current) houseRef.current.style.opacity = "1";

      } else if (elapsed < DRAW_MS + HOLD_MS) {
        /* ── hold ── */
        const e = SEGMENTS[SEGMENTS.length - 1];
        updateArm(e[e.length - 1][0], e[e.length - 1][1]);
        pathRefs.current.forEach((p) => { if (p) p.style.strokeDashoffset = "0"; });
        if (houseRef.current) houseRef.current.style.opacity = "1";

      } else if (elapsed < DRAW_MS + HOLD_MS + FADE_MS) {
        /* ── fade ── */
        const f = (elapsed - DRAW_MS - HOLD_MS) / FADE_MS;
        if (houseRef.current) houseRef.current.style.opacity = `${1 - f}`;
        const e = SEGMENTS[SEGMENTS.length - 1];
        const ep = e[e.length - 1];
        const ef = easeInOutCubic(f);
        updateArm(ep[0] + (restTip.x - ep[0]) * ef, ep[1] + (restTip.y - ep[1]) * ef);

      } else {
        /* ── reset ── */
        const r = easeInOutCubic((elapsed - DRAW_MS - HOLD_MS - FADE_MS) / RESET_MS);
        if (houseRef.current) houseRef.current.style.opacity = "0";
        pathRefs.current.forEach((p) => {
          if (p) p.style.strokeDashoffset = `${p.getTotalLength()}`;
        });
        const fp = SEGMENTS[0][0];
        updateArm(restTip.x + (fp[0] - restTip.x) * r, restTip.y + (fp[1] - restTip.y) * r);
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  /* ── Render ── */
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        viewBox="0 0 420 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* ── Defs ── */}
        <defs>
          <pattern id="fine-grid" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M 18 0 L 0 0 0 18" fill="none" stroke="rgba(35,45,63,0.055)" strokeWidth="0.5" />
          </pattern>
          <pattern id="room-grid" width="72" height="72" patternUnits="userSpaceOnUse">
            <path d="M 72 0 L 0 0 0 72" fill="none" stroke="rgba(35,45,63,0.085)" strokeWidth="0.6" />
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

        {/* ── Grid fill ── */}
        <rect width="420" height="520" fill="url(#fine-grid)" mask="url(#grid-fade)" opacity="0.7" />
        <rect width="420" height="520" fill="url(#room-grid)" mask="url(#grid-fade)" opacity="0.5" />

        {/* ── Vertical rail ── */}
        <line x1="88" y1="0" x2="88" y2="520" stroke="rgba(35,45,63,0.12)" strokeWidth="1" />
        {[40,80,120,160,200,240,280,320,360,400,440,480].map((y) => (
          <line key={y} x1="84" y1={y} x2="92" y2={y} stroke="rgba(35,45,63,0.18)" strokeWidth="0.8" />
        ))}
        {[60,100,140,180,220,260,300,340,380,420,460].map((y) => (
          <line key={`h-${y}`} x1="86" y1={y} x2="90" y2={y} stroke="rgba(35,45,63,0.1)" strokeWidth="0.6" />
        ))}

        {/* ── House drawing (animated paths) ── */}
        <g ref={houseRef} style={{ opacity: 0 }}>
          {SEGMENTS.map((seg, i) => (
            <path
              key={i}
              ref={(el) => { pathRefs.current[i] = el; }}
              d={toPathD(seg)}
              stroke="rgba(35,45,63,0.38)"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </g>

        {/* ── Arm assembly ── */}
        {/* Pivot on rail */}
        <circle ref={setArmRef("pivot")} cx="88" cy="280" r="6" fill="white" stroke="rgba(35,45,63,0.28)" strokeWidth="0.8" />
        <circle ref={setArmRef("pivotDot")} cx="88" cy="280" r="2" fill="rgba(35,45,63,0.22)" />

        {/* Primary arm + edges */}
        <line ref={setArmRef("arm1e1")} x1="90" y1="285" x2="250" y2="200" stroke="rgba(35,45,63,0.07)" strokeWidth="0.7" />
        <line ref={setArmRef("arm1e2")} x1="86" y1="275" x2="246" y2="190" stroke="rgba(35,45,63,0.07)" strokeWidth="0.7" />
        <line ref={setArmRef("arm1")} x1="88" y1="280" x2="248" y2="195" stroke="rgba(35,45,63,0.22)" strokeWidth="1.4" strokeLinecap="round" />

        {/* Elbow joint */}
        <circle ref={setArmRef("elbow")} cx="248" cy="195" r="7" fill="white" stroke="rgba(35,45,63,0.28)" strokeWidth="0.8" />
        <circle ref={setArmRef("elbowDot")} cx="248" cy="195" r="2.5" fill="rgba(0,91,65,0.35)" />

        {/* Secondary arm */}
        <line ref={setArmRef("arm2")} x1="248" y1="195" x2="280" y2="290" stroke="rgba(35,45,63,0.15)" strokeWidth="1.1" strokeLinecap="round" />

        {/* Pen tip */}
        <circle ref={setArmRef("tip")} cx="280" cy="290" r="5" fill="white" stroke="rgba(35,45,63,0.2)" strokeWidth="0.8" />
        <circle ref={setArmRef("tipDot")} cx="280" cy="290" r="1.8" fill="rgba(35,45,63,0.2)" />

        {/* ── Corner margin marks ── */}
        <path d="M 14 0 L 14 14 L 0 14" stroke="rgba(35,45,63,0.2)" strokeWidth="0.8" fill="none" />
        <path d="M 406 0 L 406 14 L 420 14" stroke="rgba(35,45,63,0.2)" strokeWidth="0.8" fill="none" />
        <path d="M 14 520 L 14 506 L 0 506" stroke="rgba(35,45,63,0.2)" strokeWidth="0.8" fill="none" />
        <path d="M 406 520 L 406 506 L 420 506" stroke="rgba(35,45,63,0.2)" strokeWidth="0.8" fill="none" />

        {/* ── Annotations ── */}
        <text x="16" y="506" fill="rgba(35,45,63,0.22)" fontSize="5.5" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.06em">SCALE 1:1</text>
        <text x="340" y="506" fill="rgba(35,45,63,0.22)" fontSize="5.5" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.06em" textAnchor="end">ELEVATION</text>

        {/* ── Panel fade overlay ── */}
        <rect width="420" height="520" fill="url(#panel-fade)" opacity="0.4" />
      </svg>
    </div>
  );
}
