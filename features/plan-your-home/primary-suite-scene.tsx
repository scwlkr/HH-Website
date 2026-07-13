import styles from "./primary-suite-scene.module.css";

type PrimarySuiteSceneProps = Readonly<{
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

export function PrimarySuiteScene({ activeAnchor }: PrimarySuiteSceneProps) {
  return (
    <div className={styles.scene} aria-hidden="true">
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="primary-suite-light" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e5eadf" />
            <stop offset="0.42" stopColor="#f7f2e8" />
            <stop offset="1" stopColor="#eee7dc" />
          </linearGradient>
          <linearGradient id="primary-window-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dce9e4" />
            <stop offset="1" stopColor="#f4eee2" />
          </linearGradient>
          <pattern id="primary-closet-grid" width="28" height="22" patternUnits="userSpaceOnUse">
            <path d="M0 21.5H28M27.5 0V22" />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="url(#primary-suite-light)" />
        <path className={styles.ceilingWash} d="M0 0H1200L980 126H220Z" />

        <g className={styles.perspectiveLine}>
          <path d="M0 0L220 126H980L1200 0M0 650L220 493H980L1200 650" />
          <path d="M220 126V493M980 126V493M0 650L493 347M1200 650L707 347" />
          <path d="M220 493H980" />
        </g>

        <g className={styles.architecturalLine}>
          <path d="M63 170H258V494H63Z" />
          <path d="M88 194H233V494M128 194V494M193 194V494" />
          <path d="M91 262H126M195 262H231" />
          <path d="M102 170V137H219V170" />
          <path d="M123 151H200M137 137V151M186 137V151" />

          <path d="M313 166H676V383H313Z" fill="url(#primary-window-light)" />
          <path d="M332 185H657V364H332ZM494 185V364" />
          <path d="M313 383L263 493M676 383L744 493" />

          <path d="M350 404L597 365L743 440L465 495Z" />
          <path d="M379 410L593 380L706 438L466 480Z" />
          <path d="M465 495V528M716 446V481" />
          <path d="M373 402L403 338L603 313L644 379" />
          <path d="M411 342L489 330L500 374L425 387Z" />
          <path d="M503 329L579 319L613 365L527 377Z" />

          <path d="M768 156H947V493H768Z" />
          <path d="M790 179H925V493M858 179V493" />
          <path d="M807 321H910V493M842 321V493M877 321V493" />
          <path d="M808 342H909M808 390H909M808 438H909" />

          <path d="M963 194H1144V493H963Z" fill="url(#primary-closet-grid)" />
          <path d="M984 215H1123V493M1054 215V493" />
          <path d="M1001 258H1036M1073 258H1107" />
          <path d="M1019 216V257M1090 216V257" />
        </g>

        <g className={styles.bathDetails}>
          <path d="M785 255H922M807 235V279M900 235V279" />
          <path d="M813 254C813 274 828 284 850 284C872 284 889 274 895 254" />
          <path d="M851 254V226M840 226H863M858 226V207" />
          <path d="M778 175L749 147M937 175L966 147" />
        </g>

        <g className={styles.materialDetails}>
          <path d="M295 493H744M768 493H1144" />
          <path d="M293 500L743 500M769 500L1145 500" />
          <path d="M702 493L742 529M721 493L761 529" />
          <path d="M257 493L218 529M238 493L199 529" />
        </g>
      </svg>

      <Anchor
        id="hall-stair-marker"
        className={styles.hallStairMarker}
        active={activeAnchor === "hall-stair-marker"}
      />
      <Anchor
        id="bed-and-window"
        className={styles.bedAndWindow}
        active={activeAnchor === "bed-and-window"}
      />
      <Anchor
        id="bath-vanity"
        className={styles.bathVanity}
        active={activeAnchor === "bath-vanity"}
      />
      <Anchor
        id="closet"
        className={styles.closet}
        active={activeAnchor === "closet"}
      />

      <div className={styles.sceneCaption}>
        <span>Primary suite study</span>
        <strong>{activeAnchor?.replaceAll("-", " ")}</strong>
      </div>
    </div>
  );
}

export function BedroomHallThresholdScene() {
  return (
    <div className={styles.threshold} aria-hidden="true">
      <PrimarySuiteScene activeAnchor="closet" />
      <div className={styles.hallReveal}>
        <span>Bedroom hall</span>
      </div>
    </div>
  );
}
