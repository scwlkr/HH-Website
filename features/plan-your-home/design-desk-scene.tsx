import styles from "./design-desk-scene.module.css";

type DesignDeskSceneProps = Readonly<{ activeAnchor?: string }>;

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

function designDeskFraming(activeAnchor?: string) {
  if (activeAnchor === "mood-board") return "xMinYMid slice";
  if (activeAnchor === "pinboard-scanner") return "xMaxYMax slice";
  if (activeAnchor === "ruler-calendar") return "xMaxYMax slice";
  return "xMinYMax slice";
}

export function DesignDeskScene({ activeAnchor }: DesignDeskSceneProps) {
  return (
    <div
      className={styles.scene}
      data-active-anchor={activeAnchor}
      data-scene-variant="design-desk"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 650"
        preserveAspectRatio={designDeskFraming(activeAnchor)}
      >
        <defs>
          <linearGradient id="desk-wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbf7ee" />
            <stop offset="1" stopColor="#e8e5da" />
          </linearGradient>
          <linearGradient id="desk-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#edf2ec" />
            <stop offset="1" stopColor="#c9dcd1" />
          </linearGradient>
          <linearGradient id="desk-surface" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e7dccb" />
            <stop offset="1" stopColor="#cdbca2" />
          </linearGradient>
          <pattern
            id="desk-plan-grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 0H0V20"
              fill="none"
              stroke="rgba(82, 111, 123, 0.2)"
              strokeWidth="0.75"
            />
          </pattern>
          <pattern
            id="desk-fabric"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 22L22 0M-8 8L8-8M14 30L30 14"
              fill="none"
              stroke="rgba(37, 55, 70, 0.18)"
              strokeWidth="5"
            />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="url(#desk-wall)" />
        <path className={styles.shadowWash} d="M0 397L1200 375V650H0Z" />

        <g className={styles.constructionLine}>
          <path d="M18 52H487M678 52H1177M18 373H1177" />
          <path d="M47 28V391M502 29V393M664 29V393M1168 28V391" />
          <path d="M15 615L238 402M1185 610L980 390M273 650L406 399M927 650L806 394" />
          <path d="M70 91H474M701 91H1143M91 348H458M716 348H1126" />
          <circle cx="47" cy="52" r="6" />
          <circle cx="1168" cy="52" r="6" />
        </g>

        <g className={styles.window}>
          <path className={styles.glassWash} d="M686 64H1150V351H686Z" />
          <path className={styles.inkLine} d="M686 64H1150V351H686ZM918 64V351" />
          <path className={styles.detailLine} d="M703 306L807 228L930 308M883 261L1000 180L1135 285" />
          <path className={styles.greenLine} d="M704 329C758 295 817 298 869 328M965 328C1021 288 1083 295 1136 326" />
          <path className={styles.detailLine} d="M798 236V322M999 190V322M1068 234V322" />
        </g>

        <g className={styles.moodBoard}>
          <path className={styles.boardWash} d="M60 69H492V367H60Z" />
          <path className={styles.inkLine} d="M60 69H492V367H60Z" />
          <path className={styles.paperWash} d="M87 96H236V215H87ZM260 93H464V184H260ZM93 238H266V341H93ZM290 211H460V342H290Z" />
          <path className={styles.detailLine} d="M107 192L161 127L218 193M279 160L331 116L386 159L442 111M115 318L177 258L240 319M313 315L375 241L437 315" />
          <path className={styles.fabricWash} d="M109 116H152V169H109ZM166 116H215V169H166ZM285 111H338V161H285ZM350 111H405V161H350ZM417 111H451V161H417Z" />
          <path className={styles.greenMark} d="M114 267L145 292L211 253M330 267L364 294L428 243" />
          <circle cx="87" cy="96" r="5" /><circle cx="464" cy="93" r="5" />
          <circle cx="93" cy="238" r="5" /><circle cx="460" cy="211" r="5" />
        </g>

        <path className={styles.deskSurface} d="M0 405L1200 381V650H0Z" />
        <path className={styles.inkLine} d="M0 405L1200 381M27 633L1200 608" />

        <g className={styles.planSheet}>
          <path className={styles.planPaper} d="M328 417L789 404L817 612L353 626Z" />
          <path className={styles.planGrid} d="M328 417L789 404L817 612L353 626Z" />
          <path className={styles.planLine} d="M389 463L493 459L496 528L392 533ZM497 459L630 455L634 531L496 528ZM634 455L747 452L754 558L637 561ZM392 533L530 528L535 586L398 591ZM535 531L637 528L642 583L535 586" />
          <path className={styles.detailLine} d="M445 459V482M568 456V479M685 454V478M496 493H521M637 501H663M471 531V550M584 529V551" />
          <path className={styles.greenMark} d="M417 504L444 481M442 504L418 482M675 535L704 506M702 536L677 510" />
        </g>

        <g className={styles.scanner} transform="translate(0 -120)">
          <path className={styles.paperWash} d="M853 396H1120V530H853Z" />
          <path className={styles.inkLine} d="M853 396H1120V530H853ZM879 421H1093V501H879Z" />
          <path className={styles.screenWash} d="M890 430H1081V491H890Z" />
          <path className={styles.detailLine} d="M911 473L958 438L1000 468L1042 441L1064 466M878 536H1101L1133 574H844Z" />
          <path className={styles.detailLine} d="M879 548H1099M900 562H1116" />
        </g>

        <g className={styles.priorityCards} transform="translate(210 -105)">
          <path className={styles.paperWash} d="M56 447L237 429L249 539L67 557ZM87 458L271 451L278 566L94 573ZM123 468L307 479L300 594L116 583Z" />
          <path className={styles.detailLine} d="M149 499L278 507M146 529L274 537M141 559L267 566" />
          <path className={styles.greenMark} d="M127 498L137 508L155 484M124 529L134 539L152 515M120 558L130 568L148 544" />
        </g>

        <g className={styles.rulerCalendar} transform="translate(-110 -90)">
          <path className={styles.woodWash} d="M722 581L1057 562L1062 601L727 620Z" />
          <path className={styles.detailLine} d="M722 581L1057 562L1062 601L727 620ZM758 579L760 598M801 576L802 593M843 574L844 591M886 571L887 589M929 569L930 586M972 566L973 584M1014 564L1016 581" />
          <path className={styles.paperWash} d="M934 416H1165V552H934Z" />
          <path className={styles.inkLine} d="M934 416H1165V552H934ZM934 449H1165M980 449V552M1026 449V552M1072 449V552M1118 449V552M934 484H1165M934 518H1165" />
          <path className={styles.greenMark} d="M986 499L996 508L1014 486M1081 467L1091 476L1109 454" />
        </g>

        <g className={styles.deskDetails}>
          <path className={styles.paperWash} d="M530 87H647V315H530Z" />
          <path className={styles.detailLine} d="M551 109H626M551 133H612M551 157H622M551 181H601M551 205H626M551 229H614M551 253H626M551 277H604" />
          <path className={styles.inkLine} d="M530 87H647V315H530Z" />
          <path className={styles.mugWash} d="M756 321H814V382H756Z" />
          <path className={styles.detailLine} d="M756 321H814V382H756ZM814 335C844 331 844 369 814 366" />
          <path className={styles.greenLine} d="M771 321C764 292 777 271 795 251M787 301C817 287 833 270 839 247M780 289C758 274 750 256 751 236" />
        </g>

        <FocusAnchor
          id="mood-board"
          path="M72 78L478 76L486 355L69 361Z"
          active={activeAnchor === "mood-board"}
        />
        <FocusAnchor
          id="pinboard-scanner"
          path="M839 266L1132 262L1145 461L831 466Z"
          active={activeAnchor === "pinboard-scanner"}
        />
        <FocusAnchor
          id="priority-stacks"
          path="M254 316L528 332L530 501L260 483Z"
          active={activeAnchor === "priority-stacks"}
        />
        <FocusAnchor
          id="ruler-calendar"
          path="M598 310L1066 307L1067 524L603 542Z"
          active={activeAnchor === "ruler-calendar"}
        />
      </svg>
    </div>
  );
}

export function ReviewBriefThresholdScene() {
  return (
    <div className={styles.reviewThreshold} aria-hidden="true">
      <DesignDeskScene activeAnchor="ruler-calendar" />
      <div className={styles.boundBrief} data-scene-anchor="review-brief">
        <span>Project brief</span>
        <i /><i /><i /><i />
      </div>
    </div>
  );
}
