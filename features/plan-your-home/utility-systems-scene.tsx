import styles from "./utility-systems-scene.module.css";

type UtilitySystemsSceneProps = Readonly<{
  activeAnchor?: string;
}>;

function Anchor({
  id,
  className,
  active,
}: Readonly<{ id: string; className: string; active: boolean }>) {
  return (
    <span
      className={`${styles.anchor} ${className}`}
      data-active={active}
      data-scene-anchor={id}
    />
  );
}

export function UtilitySystemsScene({ activeAnchor }: UtilitySystemsSceneProps) {
  return (
    <div
      className={styles.scene}
      data-scene-variant="utility-hall"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="utility-hall-paper" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e5e9df" />
            <stop offset="0.52" stopColor="#f6f0e5" />
            <stop offset="1" stopColor="#e6ece4" />
          </linearGradient>
          <linearGradient id="utility-door-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cddfcf" />
            <stop offset="1" stopColor="#edf0df" />
          </linearGradient>
          <pattern id="utility-floor-grid" width="44" height="26" patternUnits="userSpaceOnUse">
            <path d="M0 25.5H44M43.5 0V26" />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="url(#utility-hall-paper)" />
        <path className={styles.ceilingWash} d="M0 0H1200L1007 122H194Z" />
        <path className={styles.floorWash} d="M0 650L194 492H1007L1200 650Z" />
        <path className={styles.floorGrid} d="M0 650L194 492H1007L1200 650Z" />

        <g className={styles.perspectiveLine}>
          <path d="M0 0L194 122H1007L1200 0M0 650L194 492H1007L1200 650" />
          <path d="M194 122V492M1007 122V492M0 650L535 342M1200 650L665 342" />
          <path d="M194 492H1007M535 342H665" />
        </g>

        <g className={styles.architecturalLine}>
          <path d="M46 190H300V492H46Z" />
          <circle cx="116" cy="337" r="52" />
          <circle cx="229" cy="337" r="52" />
          <path d="M61 210H285M173 210V492M82 230H151M194 230H263" />
          <path d="M73 432H274M73 451H274" />

          <path d="M330 206H590V492H330Z" />
          <path d="M348 226H572V312H348ZM348 332H572V492" />
          <path d="M404 226V312M460 226V312M516 226V312" />
          <path d="M366 359H554M384 386H536M404 386V492M516 386V492" />
          <path d="M366 333V312M554 333V312" />

          <path d="M622 170H821V492H622Z" />
          <path d="M644 193H799V492M721 193V492" />
          <path d="M662 236H701M741 236H780M662 308H701M741 308H780" />
          <path d="M662 380H701M741 380H780" />

          <path d="M850 218H937V366H850Z" />
          <path d="M865 238H922V286H865ZM865 306H922M865 327H910" />
          <circle cx="893" cy="262" r="12" />

          <path d="M965 145H1154V492H965Z" fill="url(#utility-door-light)" />
          <path d="M989 171H1130V492M989 327H1130" />
          <path d="M1048 327V492M1111 349V492" />
          <circle cx="1110" cy="336" r="4" />
        </g>

        <g className={styles.outdoorLine}>
          <path d="M990 287L1032 249L1066 275L1095 229L1129 262" />
          <path d="M989 306C1024 287 1059 291 1081 306C1098 317 1113 317 1130 307" />
        </g>

        <g className={styles.materialDetails}>
          <path d="M46 492H1154M46 502H1154" />
          <path d="M310 492L268 535M330 492L289 535" />
          <path d="M821 492L783 532M842 492L805 532" />
          <path d="M965 492L930 528M1154 492L1187 528" />
        </g>
      </svg>

      <Anchor
        id="washer"
        className={styles.washer}
        active={activeAnchor === "washer"}
      />
      <Anchor
        id="mudroom-bench"
        className={styles.mudroomBench}
        active={activeAnchor === "mudroom-bench"}
      />
      <Anchor
        id="storage-built-ins"
        className={styles.storageBuiltIns}
        active={activeAnchor === "storage-built-ins"}
      />
      <Anchor
        id="system-panel"
        className={styles.systemPanel}
        active={activeAnchor === "system-panel"}
      />

      <div className={styles.sceneCaption}>
        <span>Utility hall planning study</span>
        <strong>{activeAnchor?.replaceAll("-", " ")}</strong>
      </div>
    </div>
  );
}

export function ExteriorBackDoorThresholdScene() {
  return (
    <div className={styles.threshold} aria-hidden="true">
      <UtilitySystemsScene activeAnchor="system-panel" />
      <div className={styles.backDoorReveal}>
        <span>Exterior threshold</span>
      </div>
    </div>
  );
}
