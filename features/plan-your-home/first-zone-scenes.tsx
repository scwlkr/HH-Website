import styles from "./first-zone-scenes.module.css";

type SceneProps = Readonly<{
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

function entryFraming(activeAnchor?: string) {
  return activeAnchor === "landscape-window"
    ? "xMaxYMid slice"
    : "xMidYMid slice";
}

function livingFraming(activeAnchor?: string) {
  if (activeAnchor === "fireplace-window") return "xMinYMid slice";
  if (
    activeAnchor === "stair" ||
    activeAnchor === "hall-doors" ||
    activeAnchor === "kitchen-opening"
  ) {
    return "xMaxYMid slice";
  }
  return "xMidYMid slice";
}

export function WelcomeExteriorScene({ name }: Readonly<{ name: string }>) {
  return (
    <div
      className={`${styles.scene} ${styles.exterior}`}
      data-scene-variant="welcome-exterior"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="welcome-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fbf7ee" />
            <stop offset="1" stopColor="#e7eee6" />
          </linearGradient>
          <pattern id="welcome-stone" width="38" height="22" patternUnits="userSpaceOnUse">
            <path d="M0 21H38M12 0V21M30 0V21" fill="none" stroke="rgba(37, 55, 70, 0.26)" strokeWidth="0.8" />
          </pattern>
          <pattern id="welcome-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(24)">
            <path d="M0 0V10" fill="none" stroke="rgba(42, 105, 77, 0.2)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="1200" height="650" fill="url(#welcome-sky)" />
        <path className={styles.groundWash} d="M0 468C176 430 338 445 500 421C718 388 944 414 1200 367V650H0Z" />
        <path className={styles.shadowWash} d="M152 482L477 148L813 462L1094 493L1040 555L404 541Z" />

        <g className={styles.constructionLine}>
          <path d="M84 466H1124M132 508H1075M181 119V501M471 82V523M721 151V515M1068 176V508" />
          <path d="M101 291L474 72L766 265M635 283L871 151L1120 286" />
          <path d="M112 96H537M644 130H1105M153 76V116M471 54V94M871 132V171" />
          <circle cx="471" cy="72" r="8" />
          <circle cx="871" cy="151" r="8" />
        </g>

        <g className={styles.materialWash}>
          <path d="M176 459V286L470 111L734 277V459Z" />
          <path d="M676 459V292L869 181L1080 297V459Z" />
        </g>
        <path className={styles.greenWash} d="M176 404H1080V459H176Z" />
        <path className={styles.stoneWash} d="M478 459V277H615V459Z" fill="url(#welcome-stone)" />
        <path className={styles.hatchWash} d="M709 459V305H842V459Z" fill="url(#welcome-hatch)" />
        <g className={styles.glassWash}>
          <path d="M238 321H409V432H238Z" />
          <path d="M739 317H835V431H739Z" />
          <path d="M901 295H1038V431H901Z" />
        </g>

        <g className={styles.inkLine}>
          <path d="M142 297L470 92L762 278M644 290L870 161L1107 294" />
          <path d="M176 459V286M734 459V277M676 459V292M1080 459V297" />
          <path d="M238 459V321H409V459M478 459V277H615V459" />
          <path d="M709 459V305H842V459M901 459V295H1038V459" />
          <path d="M176 459H1080M226 444H1052" />
          <path d="M506 459V322H588V459M506 346H588M548 346V459" />
          <path d="M642 459C720 477 788 509 849 557" />
        </g>
        <g className={styles.detailLine}>
          <path d="M323 321V432M238 375H409M787 317V431M739 374H835M969 295V431M901 364H1038" />
          <path d="M203 470C337 449 447 485 585 464C750 438 903 467 1101 421" />
          <path d="M63 459V353M28 459L63 379L101 459M1125 459V329M1079 459L1125 363L1172 459" />
          <circle cx="63" cy="341" r="49" />
          <circle cx="1125" cy="316" r="64" />
          <path d="M91 499C125 469 153 469 188 498M1020 495C1062 458 1115 463 1168 504" />
        </g>
      </svg>
      <div className={styles.addressPlaque}>
        <span>Welcome home</span>
        <strong>{name.trim() || "Your name"}</strong>
      </div>
      <p className={styles.sceneDisclaimer}>
        An illustrated walkthrough, not a proposed design
      </p>
    </div>
  );
}

export function EntryScene({ activeAnchor }: SceneProps) {
  return (
    <div
      className={`${styles.scene} ${styles.entry}`}
      data-active-anchor={activeAnchor}
      data-scene-variant="entry-study"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 650" preserveAspectRatio={entryFraming(activeAnchor)}>
        <defs>
          <linearGradient id="entry-light" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fffdf7" />
            <stop offset="1" stopColor="#dbe8df" />
          </linearGradient>
          <pattern id="entry-floor" width="42" height="42" patternUnits="userSpaceOnUse" patternTransform="skewX(-22)">
            <path d="M0 0H42" fill="none" stroke="rgba(37, 55, 70, 0.12)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="1200" height="650" fill="#f4efe5" />
        <path className={styles.wallWash} d="M0 0H1200V494H0Z" />
        <path className={styles.floorWash} d="M0 650V494L302 382H895L1200 650Z" fill="url(#entry-floor)" />
        <path className={styles.shadowWash} d="M396 486L719 486L786 536L344 536Z" />
        <path className={styles.glassWash} d="M814 84H1121V424H814Z" fill="url(#entry-light)" />

        <g className={styles.constructionLine}>
          <path d="M0 0L302 138H903L1200 0M0 650L302 494H903L1200 650" />
          <path d="M302 138V494M903 138V494M602 138V494" />
          <path d="M85 610L516 386M1114 610L696 386M82 558L1111 558" />
          <path d="M782 63H1147M782 447H1147M781 50V80M1148 50V80" />
          <circle cx="602" cy="386" r="7" />
        </g>

        <g className={styles.materialWash}>
          <path d="M91 214H329V493H91Z" />
          <path d="M404 315H728V486H404Z" />
        </g>
        <path className={styles.woodWash} d="M426 337H707V465H426Z" />
        <path className={styles.greenWash} d="M814 392H1121V424H814Z" />
        <g className={styles.inkLine}>
          <path d="M91 214H329V493H91ZM111 234H309V493H111Z" />
          <path d="M814 84H1121V424H814ZM835 105H1100V403H835Z" />
          <path d="M404 315H728V486H404ZM426 337H707V465H426Z" />
          <path d="M458 486V513M677 486V513M518 337V465M613 337V465" />
          <path d="M373 493H767M342 536H790" />
        </g>
        <g className={styles.detailLine}>
          <path d="M967 105V403M835 254H1100" />
          <path d="M439 308L545 268L671 293L556 331Z" />
          <path d="M463 302L548 278L645 296L552 318Z" />
          <path d="M472 365L632 337L673 416L504 442Z" />
          <path d="M493 380L640 355M499 397L649 372M506 414L657 389" />
          <circle cx="427" cy="392" r="30" />
          <path d="M397 392H457M427 362V422" />
          <path d="M846 403V286M858 403V319M833 403V341" />
          <circle cx="847" cy="258" r="46" />
          <circle cx="894" cy="302" r="28" />
          <path d="M947 403L992 344L1035 403M970 366H1015" />
        </g>

        <FocusAnchor id="rolled-plans" active={activeAnchor === "rolled-plans"} path="M420 252L690 252L709 345L418 345Z" />
        <FocusAnchor id="site-map" active={activeAnchor === "site-map"} path="M448 326L688 320L704 451L455 463Z" />
        <FocusAnchor id="landscape-window" active={activeAnchor === "landscape-window"} path="M797 69H1138V442H797Z" />
      </svg>
    </div>
  );
}

export function LivingRoomScene({ activeAnchor }: SceneProps) {
  return (
    <div
      className={`${styles.scene} ${styles.living}`}
      data-active-anchor={activeAnchor}
      data-scene-variant="living-room-study"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 650" preserveAspectRatio={livingFraming(activeAnchor)}>
        <defs>
          <linearGradient id="living-window" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fdfaf2" />
            <stop offset="1" stopColor="#dce9df" />
          </linearGradient>
          <pattern id="living-rug" width="24" height="24" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0V24" fill="none" stroke="rgba(42, 105, 77, 0.18)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="1200" height="650" fill="#f3eee4" />
        <path className={styles.wallWash} d="M0 0H1200V492H0Z" />
        <path className={styles.floorWash} d="M0 650V492L235 378H953L1200 650Z" />
        <path className={styles.glassWash} d="M54 83H385V373H54Z" fill="url(#living-window)" />
        <path className={styles.shadowWash} d="M353 490L492 400H751L877 507L792 551H426Z" />
        <path className={styles.greenWash} d="M356 471L473 394H759L868 489L811 518H414Z" />
        <path className={styles.rugWash} d="M383 480L490 408H745L846 490L789 525H438Z" fill="url(#living-rug)" />

        <g className={styles.constructionLine}>
          <path d="M0 0L235 131H955L1200 0M0 650L235 492H955L1200 650" />
          <path d="M235 131V492M955 131V492M596 131V492" />
          <path d="M235 492L474 349H742L955 492" />
          <path d="M36 58H411M36 397H411M818 106H1151M818 514H1151" />
          <circle cx="596" cy="349" r="7" />
        </g>

        <g className={styles.materialWash}>
          <path d="M404 306H790V443H404Z" />
          <path d="M271 351H440V483H271Z" />
          <path d="M824 151H1110V493H824Z" />
        </g>
        <path className={styles.woodWash} d="M690 174H810V298H690Z" />
        <g className={styles.inkLine}>
          <path d="M54 83H385V373H54ZM75 104H364V352H75Z" />
          <path d="M824 151H1110V493H824ZM848 175H1086V493" />
          <path d="M404 306H790V443H404ZM376 443H818M435 443V484M757 443V484" />
          <path d="M271 351H440V483H271ZM294 351V314H417V351" />
          <path d="M882 493V214H1016V493M899 236H999" />
          <path d="M1025 493V187H1166V493M1049 213H1141" />
        </g>
        <g className={styles.detailLine}>
          <path d="M219 104V352M75 228H364" />
          <path d="M383 480L490 408H745L846 490M438 525L383 480M789 525L846 490" />
          <path d="M428 466L506 424H728L803 473M520 424V503M604 424V512M688 424V503" />
          <path d="M690 174H810V298H690ZM706 191H751V241H706ZM760 191H794V241H760ZM706 251H794V282H706Z" />
          <path d="M482 221H540V270H482ZM552 202H621V270H552ZM635 226H685V270H635Z" />
          <path d="M435 306C461 277 492 273 520 306M675 306C704 278 741 280 768 306" />
          <path d="M300 483V425H411V483M324 425V397H388V425" />
          <path d="M882 493L1016 214M916 493L1016 279M948 493L1016 345M882 426H1016M882 363H1016M882 300H1016" />
          <path d="M1049 360C1080 332 1111 334 1141 360M1049 410H1141" />
        </g>

        <FocusAnchor id="floor-plan-rug" active={activeAnchor === "floor-plan-rug"} path="M354 481L478 390H759L878 489L803 543H419Z" />
        <FocusAnchor id="stair" active={activeAnchor === "stair"} path="M850 193H1038V513H850Z" />
        <FocusAnchor id="hall-doors" active={activeAnchor === "hall-doors"} path="M1012 168H1181V516H1012Z" />
        <FocusAnchor id="family-photos" active={activeAnchor === "family-photos"} path="M463 185H702V286H463Z" />
        <FocusAnchor id="seating" active={activeAnchor === "seating"} path="M253 291H825V496H253Z" />
        <FocusAnchor id="kitchen-opening" active={activeAnchor === "kitchen-opening"} path="M1002 142H1184V520H1002Z" />
        <FocusAnchor id="fireplace-window" active={activeAnchor === "fireplace-window"} path="M32 62H460V496H32Z" />
        <FocusAnchor id="finish-board" active={activeAnchor === "finish-board"} path="M672 155H828V315H672Z" />
      </svg>
    </div>
  );
}
