import styles from "./exterior-site-scene.module.css";

type ExteriorSiteSceneProps = Readonly<{
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

export function ExteriorSiteScene({ activeAnchor }: ExteriorSiteSceneProps) {
  return (
    <div
      className={styles.scene}
      data-scene-variant="exterior-site-study"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="exterior-paper-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2e9e4" />
            <stop offset="0.7" stopColor="#f5efe4" />
            <stop offset="1" stopColor="#e8e3d8" />
          </linearGradient>
          <linearGradient id="exterior-blueprint" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#dce8e8" />
            <stop offset="1" stopColor="#a9c0c2" />
          </linearGradient>
          <pattern id="exterior-site-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" />
          </pattern>
          <pattern id="exterior-material-hatch" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M-3 3L3-3M0 12L12 0M9 15L15 9" />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="url(#exterior-paper-sky)" />
        <path className={styles.siteWash} d="M0 493C166 438 327 454 474 488C632 525 764 520 908 477C1031 441 1128 451 1200 476V650H0Z" />
        <path className={styles.gradeLines} d="M0 544C184 485 339 509 493 544C640 578 790 573 927 527C1039 489 1137 502 1200 523M0 583C182 526 339 548 493 581C647 614 799 606 938 563C1046 529 1134 538 1200 556M0 619C188 568 350 585 507 614C659 642 804 635 952 597C1053 571 1136 576 1200 589" />

        <g className={styles.houseFill}>
          <path d="M284 270L512 141L747 266V493H284Z" />
          <path d="M747 304L874 242L1043 337V493H747Z" />
          <path d="M83 333L174 273L304 329V493H83Z" />
        </g>
        <g className={styles.architecturalLine}>
          <path d="M255 278L511 132L779 281M284 270L512 141L747 266V493H284Z" />
          <path d="M321 493V312L512 202L705 307V493" />
          <path d="M467 493V349H573V493M485 366H555V410H485Z" />
          <path d="M347 354H433V430H347ZM605 346H687V430H605Z" />
          <path d="M747 304L874 242L1043 337V493H747ZM770 493V335L873 282L1018 354V493" />
          <path d="M801 373H986V493H801ZM894 373V493M814 392H878M910 392H973" />
          <path d="M67 342L172 267L318 332M83 333L174 273L304 329V493H83Z" />
          <path d="M102 493V350H285V493M193 350V493M119 370H177M210 370H268" />
          <path d="M44 493H1073M59 504H1052" />
        </g>

        <g className={styles.materialBoard}>
          <path d="M55 108H235V248H55Z" />
          <path d="M69 124H133V183H69ZM145 124H221V183H145Z" />
          <path d="M69 196H221V232H69Z" />
          <path className={styles.materialHatch} d="M69 124H133V183H69Z" />
          <path d="M69 196L89 216L108 202L127 220L147 200L168 217L187 201L207 217" />
        </g>

        <g className={styles.siteCompass}>
          <circle cx="1081" cy="132" r="66" />
          <circle cx="1081" cy="132" r="35" />
          <path d="M1081 53V211M1002 132H1160M1081 67L1090 123L1081 132L1072 123Z" />
          <path d="M1019 239C1041 210 1051 183 1055 151M1123 238C1109 205 1104 178 1106 149" />
        </g>

        <g className={styles.landscapeLine}>
          <path d="M108 292C74 255 91 208 129 202C133 158 192 147 210 187C248 175 271 214 249 244C270 275 235 306 203 291Z" />
          <path d="M177 285V425M177 325L143 292M177 345L211 307" />
          <path d="M941 309C913 281 926 243 960 239C966 204 1014 197 1030 229C1061 220 1084 252 1066 279C1086 306 1054 330 1028 319Z" />
          <path d="M1002 312V437M1002 348L974 321M1002 363L1030 333" />
        </g>

        <g className={styles.patioLine}>
          <path d="M568 493L737 493L842 588H455Z" />
          <path d="M526 544H778M495 567H808M607 493L572 588M654 493V588M701 493L735 588" />
          <path d="M610 515H689V549H610ZM622 549V576M677 549V576" />
        </g>

        <g className={styles.blueprintRoll}>
          <path d="M882 499H1104L1152 584H922Z" fill="url(#exterior-blueprint)" />
          <path className={styles.blueprintGrid} d="M894 509H1098L1130 570H929Z" />
          <path d="M914 524L972 512L1034 535L1091 520M935 553L997 535L1055 554L1110 542" />
          <path d="M882 499C882 486 891 476 904 476H1085C1098 476 1107 486 1107 499Z" />
          <path d="M1104 499C1124 502 1137 515 1142 532" />
        </g>

        <g className={styles.surveyMarks}>
          <path d="M45 88H92M68 65V111M1119 280H1174M1147 253V307M318 548H365M341 525V571" />
          <path d="M31 464L61 444M1138 456L1170 476" />
        </g>
      </svg>

      <Anchor id="garage" className={styles.garage} active={activeAnchor === "garage"} />
      <Anchor
        id="elevation-samples"
        className={styles.elevationSamples}
        active={activeAnchor === "elevation-samples"}
      />
      <Anchor
        id="sun-compass-trees"
        className={styles.sunCompassTrees}
        active={activeAnchor === "sun-compass-trees"}
      />
      <Anchor id="patio" className={styles.patio} active={activeAnchor === "patio"} />
      <Anchor
        id="outbuilding-plan"
        className={styles.outbuildingPlan}
        active={activeAnchor === "outbuilding-plan"}
      />

      <div className={styles.sceneCaption}>
        <span>Fixed exterior and site study</span>
        <strong>{activeAnchor?.replaceAll("-", " ")}</strong>
      </div>
    </div>
  );
}

export function BlueprintDesignDeskThresholdScene() {
  return (
    <div className={styles.blueprintThreshold} aria-hidden="true">
      <ExteriorSiteScene activeAnchor="outbuilding-plan" />
      <div className={styles.matchCutSheet}>
        <span>Design desk threshold</span>
        <div />
      </div>
    </div>
  );
}
