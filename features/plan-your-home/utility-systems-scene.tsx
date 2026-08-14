import styles from "./utility-systems-scene.module.css";

type UtilitySystemsSceneProps = Readonly<{
  activeAnchor?: string;
}>;

function FocusAnchor({
  id,
  path,
  active,
}: Readonly<{ id: string; path: string; active: boolean }>) {
  return (
    <g
      className={styles.anchor}
      data-active={active}
      data-scene-anchor={id}
    >
      <path className={styles.anchorWash} d={path} />
      <path className={styles.anchorContour} d={path} />
    </g>
  );
}

function utilityFraming(activeAnchor?: string) {
  if (activeAnchor === "washer") return "xMinYMid slice";
  if (activeAnchor === "storage-built-ins" || activeAnchor === "system-panel") {
    return "xMaxYMid slice";
  }
  return "xMidYMid slice";
}

export function UtilitySystemsScene({ activeAnchor }: UtilitySystemsSceneProps) {
  return (
    <div
      className={styles.scene}
      data-active-anchor={activeAnchor}
      data-scene-variant="utility-hall"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 650"
        preserveAspectRatio={utilityFraming(activeAnchor)}
      >
        <defs>
          <linearGradient id="utility-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf7" />
            <stop offset="1" stopColor="#dbe8df" />
          </linearGradient>
          <pattern
            id="utility-floor"
            width="42"
            height="42"
            patternUnits="userSpaceOnUse"
            patternTransform="skewX(-24)"
          >
            <path
              d="M0 0H42"
              fill="none"
              stroke="rgba(37, 55, 70, 0.12)"
              strokeWidth="0.8"
            />
          </pattern>
          <pattern
            id="utility-cabinet-hatch"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 24L24 0"
              fill="none"
              stroke="rgba(37, 55, 70, 0.11)"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="#f3eee4" />
        <path className={styles.wallWash} d="M0 0H1200V492H0Z" />
        <path
          className={styles.floorWash}
          d="M0 650V492L194 378H1007L1200 650Z"
          fill="url(#utility-floor)"
        />
        <path
          className={styles.glassWash}
          d="M991 148H1155V329H991Z"
          fill="url(#utility-window)"
        />
        <path
          className={styles.shadowWash}
          d="M89 485L360 421H852L1056 501L926 542H293Z"
        />
        <path
          className={styles.greenWash}
          d="M141 480L381 433H834L1017 499L906 528H312Z"
        />

        <g className={styles.constructionLine}>
          <path d="M0 0L194 122H1007L1200 0M0 650L194 492H1007L1200 650" />
          <path d="M194 122V492M1007 122V492M600 122V492" />
          <path d="M194 492L474 341H725L1007 492" />
          <path d="M18 86H315M18 516H315M327 86H662M327 516H662" />
          <path d="M680 86H955M680 516H955M970 86H1184M970 516H1184" />
          <circle cx="600" cy="341" r="7" />
        </g>

        <g className={styles.materialWash}>
          <path d="M32 178H302V493H32Z" />
          <path d="M330 206H626V493H330Z" />
          <path d="M653 155H882V493H653Z" fill="url(#utility-cabinet-hatch)" />
          <path d="M899 218H968V358H899Z" />
          <path d="M977 132H1171V493H977Z" />
        </g>
        <path className={styles.woodWash} d="M352 337H604V493H352Z" />
        <path className={styles.stoneWash} d="M43 432H291V493H43Z" />

        <g className={styles.inkLine}>
          <path d="M32 178H302V493H32ZM55 202H279V493" />
          <path d="M55 202H279M167 202V493" />
          <circle cx="106" cy="338" r="48" />
          <circle cx="228" cy="338" r="48" />
          <path d="M330 206H626V493H330ZM352 230H604V493" />
          <path d="M352 337H604M352 365H604M384 365V493M572 365V493" />
          <path d="M653 155H882V493H653ZM678 180H857V493" />
          <path d="M678 284H857M678 389H857M767 180V493" />
          <path d="M899 218H968V358H899Z" />
          <path d="M977 132H1171V493H977ZM1001 157H1147V493" />
          <path d="M1001 329H1147M1084 329V493" />
        </g>

        <g className={styles.detailLine}>
          <path d="M68 220H148M190 220H270M69 432H270" />
          <circle cx="106" cy="338" r="31" />
          <circle cx="228" cy="338" r="31" />
          <path d="M374 255H582M394 283H562" />
          <path d="M374 337L408 306H550L582 337" />
          <path d="M401 392H555M424 419H532" />
          <path d="M700 217H744M790 217H835M700 324H744M790 324H835" />
          <path d="M700 427H744M790 427H835" />
          <path d="M913 235H954V275H913ZM913 295H954M913 317H946" />
          <circle cx="933" cy="255" r="9" />
          <path d="M991 148H1155V329H991ZM1012 169H1134V308M1073 169V308" />
          <path d="M1015 374H1132M1015 397H1132" />
          <circle cx="1126" cy="343" r="5" />
          <path d="M1007 493L970 531M1171 493L1194 520" />
        </g>

        <FocusAnchor
          id="washer"
          active={activeAnchor === "washer"}
          path="M17 161H318V512H17Z"
        />
        <FocusAnchor
          id="mudroom-bench"
          active={activeAnchor === "mudroom-bench"}
          path="M313 190H642V512H313Z"
        />
        <FocusAnchor
          id="storage-built-ins"
          active={activeAnchor === "storage-built-ins"}
          path="M638 139H897V512H638Z"
        />
        <FocusAnchor
          id="system-panel"
          active={activeAnchor === "system-panel"}
          path="M884 200H982V375H884Z"
        />
      </svg>
    </div>
  );
}

export function ExteriorBackDoorThresholdScene() {
  return (
    <div className={styles.threshold} aria-hidden="true">
      <UtilitySystemsScene activeAnchor="system-panel" />
      <div className={styles.backDoorReveal} />
    </div>
  );
}
