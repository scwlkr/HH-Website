import styles from "./exterior-site-scene.module.css";

type ExteriorSiteSceneProps = Readonly<{
  activeAnchor?: string;
}>;

function FocusAnchor({
  id,
  path,
  active,
}: Readonly<{ id: string; path: string; active: boolean }>) {
  return (
    <g className={styles.anchor} data-active={active} data-scene-anchor={id}>
      <path className={styles.anchorWash} d={path} />
      <path className={styles.anchorContour} d={path} />
    </g>
  );
}

function exteriorFraming(activeAnchor?: string) {
  if (activeAnchor === "garage") return "xMinYMid slice";
  if (activeAnchor === "elevation-samples") return "xMidYMid slice";
  return "xMaxYMid slice";
}

export function ExteriorSiteScene({ activeAnchor }: ExteriorSiteSceneProps) {
  return (
    <div
      className={styles.scene}
      data-active-anchor={activeAnchor}
      data-scene-variant="exterior-site-study"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 650"
        preserveAspectRatio={exteriorFraming(activeAnchor)}
      >
        <defs>
          <linearGradient id="exterior-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbf7ee" />
            <stop offset="1" stopColor="#e4ece5" />
          </linearGradient>
          <linearGradient id="exterior-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf7" />
            <stop offset="1" stopColor="#cddfd6" />
          </linearGradient>
          <pattern
            id="exterior-stone"
            width="38"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 21H38M12 0V21M30 0V21"
              fill="none"
              stroke="rgba(37, 55, 70, 0.24)"
              strokeWidth="0.8"
            />
          </pattern>
          <pattern
            id="exterior-siding"
            width="18"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 17.5H18"
              fill="none"
              stroke="rgba(37, 55, 70, 0.15)"
              strokeWidth="0.8"
            />
          </pattern>
          <pattern
            id="exterior-plan-grid"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M24 0H0V24"
              fill="none"
              stroke="rgba(82, 111, 123, 0.24)"
              strokeWidth="0.8"
            />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="url(#exterior-sky)" />
        <path
          className={styles.groundWash}
          d="M0 475C175 430 322 458 474 470C676 487 824 456 988 409C1073 385 1147 394 1200 418V650H0Z"
        />
        <path
          className={styles.shadowWash}
          d="M43 492L344 430L901 448L1086 508L981 556L301 548Z"
        />
        <path className={styles.driveWash} d="M0 650V523L50 483H318L533 650Z" />
        <path
          className={styles.patioWash}
          d="M725 458L932 433L1134 604L1088 650H657Z"
        />

        <g className={styles.constructionLine}>
          <path d="M14 503H1128M44 542H1165M73 581H1191" />
          <path d="M17 283L169 160L356 277M235 315L532 83L936 307" />
          <path d="M169 141V526M532 66V539M911 179V528M1110 215V524" />
          <path d="M18 109H382M312 57H760M814 148H1164" />
          <path d="M114 650L215 492M285 650L273 492M755 650L814 456M1045 650L912 436" />
          <circle cx="169" cy="160" r="7" />
          <circle cx="532" cy="83" r="7" />
        </g>

        <g className={styles.materialWash}>
          <path d="M27 287L169 177L340 284V501H27Z" />
          <path d="M264 312L532 105L909 310V501H264Z" />
          <path d="M824 323L947 237L1114 326V501H824Z" />
        </g>
        <path
          className={styles.sidingWash}
          d="M286 317L532 128L693 218V501H286Z"
          fill="url(#exterior-siding)"
        />
        <path
          className={styles.stoneWash}
          d="M575 501V251L693 218L756 252V501Z"
          fill="url(#exterior-stone)"
        />
        <path className={styles.woodWash} d="M49 336H318V501H49Z" />
        <path className={styles.greenWash} d="M264 452H1114V501H264Z" />
        <g className={styles.glassWash}>
          <path d="M352 314H503V436H352Z" fill="url(#exterior-window)" />
          <path d="M779 321H884V436H779Z" fill="url(#exterior-window)" />
          <path d="M970 329H1084V439H970Z" fill="url(#exterior-window)" />
        </g>

        <g className={styles.inkLine}>
          <path d="M9 294L169 160L359 283M27 501V287M340 501V284" />
          <path d="M49 501V336H318V501M183 336V501" />
          <path d="M235 315L532 83L936 307M264 501V312M909 501V310" />
          <path d="M286 501V317L532 128L693 218V501" />
          <path d="M575 501V251L693 218L756 252V501" />
          <path d="M352 501V314H503V501M779 501V321H884V501" />
          <path d="M824 501V323L947 237L1114 326V501" />
          <path d="M970 501V329H1084V501" />
          <path d="M19 501H1130M47 514H1112" />
          <path d="M608 501V332H703V501M608 359H703M655 359V501" />
        </g>

        <g className={styles.detailLine}>
          <path d="M74 361H158M208 361H292M74 383H158M208 383H292" />
          <path d="M427 314V436M352 375H503M831 321V436M779 379H884" />
          <path d="M1027 329V439M970 383H1084" />
          <path d="M49 475L182 446L318 475M305 501L443 536M862 501L1000 548" />
          <path d="M646 507C722 522 777 555 828 603" />
          <path d="M744 470L930 449L1085 579M790 459L965 475L1113 615" />
          <path d="M735 505L1020 542M710 546L1071 586M688 588L1111 624" />
          <path d="M111 520C168 493 222 497 274 527M474 528C545 501 610 505 681 535" />
        </g>

        <g className={styles.landscapeLine}>
          <path d="M1034 280C995 244 1014 197 1054 195C1060 148 1122 140 1141 182C1180 169 1207 210 1182 242C1203 276 1165 307 1130 291Z" />
          <path d="M1101 286V445M1101 333L1064 298M1101 352L1141 309" />
          <path d="M921 419C950 386 980 387 1003 417M981 428C1015 390 1055 394 1086 430" />
          <circle cx="996" cy="111" r="43" />
          <path d="M996 50V172M935 111H1057M996 63L1005 102L996 111L987 102Z" />
          <path d="M946 181C969 156 980 134 984 110M1038 181C1025 154 1020 132 1021 108" />
        </g>

        <g className={styles.planRoll}>
          <path className={styles.planPaper} d="M901 471H1163L1193 629H927Z" />
          <path
            className={styles.planGrid}
            d="M916 485H1148L1174 614H943Z"
            fill="url(#exterior-plan-grid)"
          />
          <path d="M937 510L1002 490L1060 516L1120 497M952 557L1015 530L1080 559L1142 535" />
          <path d="M901 471C902 454 914 444 932 444H1138C1157 444 1166 454 1163 471Z" />
          <path d="M1163 471C1182 475 1192 489 1192 508" />
        </g>

        <FocusAnchor
          id="garage"
          active={activeAnchor === "garage"}
          path="M9 294L169 160L359 283V518H9Z"
        />
        <FocusAnchor
          id="elevation-samples"
          active={activeAnchor === "elevation-samples"}
          path="M235 315L532 83L936 307V518H235Z"
        />
        <FocusAnchor
          id="sun-compass-trees"
          active={activeAnchor === "sun-compass-trees"}
          path="M926 43H1191V458H926Z"
        />
        <FocusAnchor
          id="patio"
          active={activeAnchor === "patio"}
          path="M707 434L943 414L1149 603L1100 648H655Z"
        />
        <FocusAnchor
          id="outbuilding-plan"
          active={activeAnchor === "outbuilding-plan"}
          path="M886 433H1199V645H914Z"
        />
      </svg>
    </div>
  );
}

export function BlueprintDesignDeskThresholdScene() {
  return (
    <div className={styles.blueprintThreshold} aria-hidden="true">
      <ExteriorSiteScene activeAnchor="outbuilding-plan" />
      <div className={styles.matchCutSheet}>
        <div />
      </div>
    </div>
  );
}
