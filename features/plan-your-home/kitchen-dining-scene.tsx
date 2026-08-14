import styles from "./kitchen-dining-scene.module.css";

type KitchenDiningSceneProps = Readonly<{
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

function kitchenFraming(activeAnchor?: string) {
  if (activeAnchor === "room-opening") return "xMinYMid slice";
  if (activeAnchor === "pantry-door" || activeAnchor === "dining-table") {
    return "xMaxYMid slice";
  }
  return "xMidYMid slice";
}

export function KitchenDiningScene({
  activeAnchor,
}: KitchenDiningSceneProps) {
  return (
    <div
      className={styles.scene}
      data-active-anchor={activeAnchor}
      data-scene-variant="kitchen-dining-study"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 650"
        preserveAspectRatio={kitchenFraming(activeAnchor)}
      >
        <defs>
          <linearGradient id="kitchen-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fffdf7" />
            <stop offset="1" stopColor="#dbe8df" />
          </linearGradient>
          <pattern
            id="kitchen-tile"
            width="34"
            height="18"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 17.5H34M17 0V17.5"
              fill="none"
              stroke="rgba(37, 55, 70, 0.2)"
              strokeWidth="0.75"
            />
          </pattern>
          <pattern
            id="kitchen-floor"
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
        </defs>

        <rect width="1200" height="650" fill="#f3eee4" />
        <path className={styles.wallWash} d="M0 0H1200V492H0Z" />
        <path
          className={styles.floorWash}
          d="M0 650V492L236 378H955L1200 650Z"
          fill="url(#kitchen-floor)"
        />
        <path
          className={styles.glassWash}
          d="M340 112H665V300H340Z"
          fill="url(#kitchen-window)"
        />
        <path
          className={styles.shadowWash}
          d="M402 475L546 377H777L878 461L805 516H487Z"
        />
        <path
          className={styles.greenWash}
          d="M414 459L548 385H771L858 459L791 497H493Z"
        />
        <path
          className={styles.rugWash}
          d="M879 463L962 405H1122L1185 462L1127 501H946Z"
        />

        <g className={styles.constructionLine}>
          <path d="M0 0L236 131H955L1200 0M0 650L236 492H955L1200 650" />
          <path d="M236 131V492M955 131V492M596 131V492" />
          <path d="M236 492L466 349H752L955 492" />
          <path d="M18 93H278M18 505H278M313 88H697M313 322H697" />
          <path d="M736 91H926M736 508H926M866 85H1184M866 513H1184" />
          <circle cx="596" cy="349" r="7" />
        </g>

        <g className={styles.materialWash}>
          <path d="M294 302H711V467H294Z" />
          <path d="M748 181H904V493H748Z" />
          <path d="M920 339L1034 310L1162 379L1031 421Z" />
        </g>
        <path
          className={styles.tileWash}
          d="M294 205H711V302H294Z"
          fill="url(#kitchen-tile)"
        />
        <path className={styles.woodWash} d="M455 379L712 337L843 427L552 482Z" />
        <path className={styles.stoneWash} d="M441 370L714 324L865 420L550 493Z" />

        <g className={styles.inkLine}>
          <path d="M32 149H252V493H32ZM57 175H227V493" />
          <path d="M57 175L142 215L227 175M142 215V493" />
          <path d="M294 205H711V467H294ZM318 229H687V467" />
          <path d="M340 112H665V300H340ZM362 134H643V278" />
          <path d="M502 134V278M362 206H643" />
          <path d="M407 302V467M520 302V467M625 302V467" />
          <path d="M439 205V302H565V205M455 231H549V302" />
          <path d="M455 379L712 337L843 427L552 482ZM552 482V524M817 429V471" />
          <path d="M748 181H904V493H748ZM771 205H881V493" />
          <path d="M793 205V493M856 205V493M770 314H881" />
          <path d="M920 339L1034 310L1162 379L1031 421ZM941 346V479M1139 380V483" />
        </g>

        <g className={styles.detailLine}>
          <path d="M331 467V327H392V467M640 467V327H687V467" />
          <path d="M465 337H542M476 350H531" />
          <path d="M593 357L646 349L672 367L618 377Z" />
          <path d="M609 351C607 364 615 371 627 369C639 367 647 358 646 348" />
          <path d="M715 335V301M704 301H728M722 301V280" />
          <path d="M491 395L744 356M518 414L773 376M542 435L803 397" />
          <path d="M967 327V278M997 319V270M1078 327V270M1107 338V282" />
          <path d="M947 278H1007M1050 270H1118" />
          <path d="M1034 164V121M1010 121H1058M1017 121L995 184H1079L1052 121" />
          <path d="M1112 493V425M1094 493L1109 442M1130 493L1118 443" />
          <path d="M1080 425C1094 399 1110 404 1113 436C1128 405 1144 413 1126 449" />
        </g>

        <FocusAnchor
          id="range-and-island"
          active={activeAnchor === "range-and-island"}
          path="M404 184H584V318H404ZM421 352L720 304L883 416L553 511Z"
        />
        <FocusAnchor
          id="room-opening"
          active={activeAnchor === "room-opening"}
          path="M16 130H273V512H16Z"
        />
        <FocusAnchor
          id="pantry-door"
          active={activeAnchor === "pantry-door"}
          path="M728 161H925V512H728Z"
        />
        <FocusAnchor
          id="dining-table"
          active={activeAnchor === "dining-table"}
          path="M892 292L1041 272L1182 367L1170 503H923Z"
        />
      </svg>
    </div>
  );
}
