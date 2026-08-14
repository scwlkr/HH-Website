import styles from "./primary-suite-scene.module.css";

type PrimarySuiteSceneProps = Readonly<{
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

function primaryFraming(activeAnchor?: string) {
  if (activeAnchor === "hall-stair-marker") return "xMinYMid slice";
  if (activeAnchor === "bath-vanity" || activeAnchor === "closet") {
    return "xMaxYMid slice";
  }
  return "xMidYMid slice";
}

export function PrimarySuiteScene({ activeAnchor }: PrimarySuiteSceneProps) {
  return (
    <div
      className={styles.scene}
      data-active-anchor={activeAnchor}
      data-scene-variant="primary-suite-study"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 650"
        preserveAspectRatio={primaryFraming(activeAnchor)}
      >
        <defs>
          <linearGradient id="primary-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf7" />
            <stop offset="1" stopColor="#dbe8df" />
          </linearGradient>
          <pattern
            id="primary-floor"
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
            id="primary-tile"
            width="28"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 17.5H28M27.5 0V18"
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
          fill="url(#primary-floor)"
        />
        <path
          className={styles.glassWash}
          d="M331 111H668V316H331Z"
          fill="url(#primary-window)"
        />
        <path
          className={styles.shadowWash}
          d="M345 459L491 370H707L815 460L739 516H445Z"
        />
        <path
          className={styles.greenWash}
          d="M361 455L501 383H696L797 457L726 497H454Z"
        />

        <g className={styles.constructionLine}>
          <path d="M0 0L236 131H955L1200 0M0 650L236 492H955L1200 650" />
          <path d="M236 131V492M955 131V492M596 131V492" />
          <path d="M236 492L466 349H752L955 492" />
          <path d="M18 83H277M18 510H277M303 83H696M303 337H696" />
          <path d="M719 94H946M719 510H946M934 87H1185M934 512H1185" />
          <circle cx="596" cy="349" r="7" />
        </g>

        <g className={styles.materialWash}>
          <path d="M27 153H268V493H27Z" />
          <path d="M719 177H930V493H719Z" />
          <path d="M956 166H1173V493H956Z" />
        </g>
        <path className={styles.woodWash} d="M370 366L590 331L755 425L480 486Z" />
        <path
          className={styles.tileWash}
          d="M742 204H906V345H742Z"
          fill="url(#primary-tile)"
        />
        <path className={styles.stoneWash} d="M741 344H908V493H741Z" />

        <g className={styles.inkLine}>
          <path d="M27 153H268V493H27ZM52 178H243V493" />
          <path d="M52 178L146 219L243 178M146 219V493" />
          <path d="M75 493L116 423H232M98 493L139 437H232M123 493L161 451H232" />
          <path d="M331 111H668V316H331ZM353 133H646V294" />
          <path d="M500 133V294M353 214H646" />
          <path d="M370 366L590 331L755 425L480 486ZM480 486V525M730 427V473" />
          <path d="M399 363L430 309L611 285L657 350" />
          <path d="M719 177H930V493H719ZM742 204H906V493" />
          <path d="M742 345H906M824 204V345" />
          <path d="M759 369H889V493M789 369V493M859 369V493" />
          <path d="M956 166H1173V493H956ZM980 190H1149V493" />
          <path d="M1038 190V493M1095 190V493M980 311H1149" />
        </g>

        <g className={styles.detailLine}>
          <path d="M72 128H226M92 128V108M206 128V108M92 108H206" />
          <path d="M426 312L494 301L512 353L442 365Z" />
          <path d="M511 299L581 290L626 341L541 354Z" />
          <path d="M392 389L611 351M422 410L648 370M452 432L685 392" />
          <path d="M762 276H889M782 254V300M869 254V300" />
          <path d="M790 276C790 298 807 309 831 309C855 309 874 298 881 276" />
          <path d="M834 276V243M822 243H847M841 243V222" />
          <path d="M750 200L720 171M898 200L929 171" />
          <path d="M1001 241H1030M1060 241H1088M1117 241H1138" />
          <path d="M997 329H1033M1059 329H1091M1117 329H1140" />
          <path d="M984 493V410M1021 493V423M1063 493V410M1104 493V423M1138 493V410" />
        </g>

        <FocusAnchor
          id="hall-stair-marker"
          active={activeAnchor === "hall-stair-marker"}
          path="M12 132H286V513H12Z"
        />
        <FocusAnchor
          id="bed-and-window"
          active={activeAnchor === "bed-and-window"}
          path="M304 91H691V330H304ZM337 341L598 303L783 422L483 511Z"
        />
        <FocusAnchor
          id="bath-vanity"
          active={activeAnchor === "bath-vanity"}
          path="M699 157H949V512H699Z"
        />
        <FocusAnchor
          id="closet"
          active={activeAnchor === "closet"}
          path="M936 146H1192V512H936Z"
        />
      </svg>
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
