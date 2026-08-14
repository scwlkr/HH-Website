import styles from "./bedrooms-shared-bathrooms-scene.module.css";

type BedroomsSharedBathroomsSceneProps = Readonly<{
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

function bedroomHallFraming(activeAnchor?: string) {
  return activeAnchor === "shared-bath-vanity"
    ? "xMaxYMid slice"
    : "xMinYMid slice";
}

export function BedroomsSharedBathroomsScene({
  activeAnchor,
}: BedroomsSharedBathroomsSceneProps) {
  return (
    <div
      className={styles.scene}
      data-active-anchor={activeAnchor}
      data-scene-variant="representative-bedroom-hall"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 650"
        preserveAspectRatio={bedroomHallFraming(activeAnchor)}
      >
        <defs>
          <linearGradient id="secondary-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf7" />
            <stop offset="1" stopColor="#dbe8df" />
          </linearGradient>
          <pattern
            id="secondary-floor"
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
            id="secondary-tile"
            width="30"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 17.5H30M29.5 0V18"
              fill="none"
              stroke="rgba(37, 55, 70, 0.2)"
              strokeWidth="0.75"
            />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="#f3eee4" />
        <path className={styles.wallWash} d="M0 0H1200V492H0Z" />
        <path
          className={styles.floorWash}
          d="M0 650V492L236 378H955L1200 650Z"
          fill="url(#secondary-floor)"
        />
        <path
          className={styles.glassWash}
          d="M108 112H310V268H108ZM782 134H1087V300H782Z"
          fill="url(#secondary-window)"
        />
        <path
          className={styles.shadowWash}
          d="M111 490L332 421H660L825 503L715 544H270Z"
        />
        <path
          className={styles.greenWash}
          d="M148 482L346 431H647L791 501L696 529H283Z"
        />

        <g className={styles.constructionLine}>
          <path d="M0 0L236 131H955L1200 0M0 650L236 492H955L1200 650" />
          <path d="M236 131V492M955 131V492M596 131V492" />
          <path d="M236 492L466 349H752L955 492" />
          <path d="M18 82H361M18 514H361M385 82H692M385 514H692" />
          <path d="M716 82H1184M716 514H1184" />
          <circle cx="596" cy="349" r="7" />
        </g>

        <g className={styles.materialWash}>
          <path d="M31 149H356V493H31Z" />
          <path d="M393 165H680V493H393Z" />
          <path d="M716 156H1172V493H716Z" />
        </g>
        <path className={styles.woodWash} d="M487 354L647 332L723 391L543 421Z" />
        <path
          className={styles.tileWash}
          d="M741 180H1147V348H741Z"
          fill="url(#secondary-tile)"
        />
        <path className={styles.stoneWash} d="M748 365H1142V493H748Z" />

        <g className={styles.inkLine}>
          <path d="M31 149H356V493H31ZM57 176H330V493" />
          <path d="M57 176L193 230L330 176M193 230V493" />
          <path d="M91 493V282H175M296 493V282H211" />
          <path d="M393 165H680V493H393ZM419 191H654V493" />
          <path d="M419 191L536 238L654 191M536 238V493" />
          <path d="M716 156H1172V493H716ZM741 180H1147V493" />
          <path d="M741 348H1147M944 180V348" />
          <path d="M748 365H1142V493M777 390H1113V493" />
          <path d="M854 390V493M944 390V493M1037 390V493" />
        </g>

        <g className={styles.detailLine}>
          <path d="M108 112H310V268H108ZM128 132H290V248M209 132V248" />
          <path d="M84 126H330M108 126V101M310 126V101M108 101H310" />
          <path d="M74 302H158M227 302H311M457 304H514M557 304H614" />
          <circle cx="162" cy="314" r="5" />
          <circle cx="610" cy="314" r="5" />
          <path d="M487 354L647 332L723 391L543 421ZM543 421V458M704 393V434" />
          <path d="M514 354L536 312H633L667 341" />
          <path d="M782 134H1087V300H782ZM805 157H1064V277M934 157V277" />
          <path d="M791 365C791 389 812 402 844 402C876 402 897 389 897 365" />
          <path d="M992 365C992 389 1013 402 1045 402C1077 402 1098 389 1098 365" />
          <path d="M844 365V330M830 330H858M853 330V307" />
          <path d="M1045 365V330M1031 330H1059M1054 330V307" />
          <path d="M756 493L723 531M1142 493L1176 532" />
        </g>

        <FocusAnchor
          id="bedroom-door-cluster"
          active={activeAnchor === "bedroom-door-cluster"}
          path="M16 130H371V512H16ZM378 146H695V512H378Z"
        />
        <FocusAnchor
          id="shared-bath-vanity"
          active={activeAnchor === "shared-bath-vanity"}
          path="M701 141H1187V512H701Z"
        />
      </svg>
    </div>
  );
}

export function UtilityHallThresholdScene() {
  return (
    <div className={styles.threshold} aria-hidden="true">
      <BedroomsSharedBathroomsScene activeAnchor="shared-bath-vanity" />
      <div className={styles.utilityReveal} />
    </div>
  );
}
