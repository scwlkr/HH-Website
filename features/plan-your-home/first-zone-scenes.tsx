import styles from "./first-zone-scenes.module.css";

type SceneProps = Readonly<{
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

export function WelcomeExteriorScene({ name }: Readonly<{ name: string }>) {
  return (
    <div className={`${styles.scene} ${styles.exterior}`} aria-hidden="true">
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="welcome-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8f3e9" />
            <stop offset="1" stopColor="#e6ede5" />
          </linearGradient>
          <pattern id="welcome-stone" width="32" height="18" patternUnits="userSpaceOnUse">
            <path d="M0 17.5H32M16 0V17.5" />
          </pattern>
        </defs>
        <rect width="1200" height="650" fill="url(#welcome-sky)" />
        <path className={styles.horizon} d="M0 476C180 425 354 452 520 421C740 380 963 402 1200 354V650H0Z" />
        <g className={styles.houseFill}>
          <path d="M190 456V282L470 124L720 274V456Z" />
          <path d="M674 456V294L867 204L1060 306V456Z" />
        </g>
        <g className={styles.architecturalLine}>
          <path d="M157 291L468 107L747 279M650 301L864 182L1093 308" />
          <path d="M190 456V282M720 456V274M674 456V294M1060 456V306" />
          <path d="M264 456V322H404V456M495 456V292H612V456" />
          <path d="M747 456V318H842V456M884 456V288H1014V456" />
          <path d="M432 456V335H526V456" />
          <path d="M620 456C711 476 775 503 835 548" />
        </g>
        <path className={styles.stone} d="M495 456V292H612V456Z" fill="url(#welcome-stone)" />
        <g className={styles.landscapeLine}>
          <path d="M66 456V340M31 456L67 367L103 456M1123 456V316M1076 456L1123 350L1170 456" />
          <circle cx="67" cy="330" r="53" />
          <circle cx="1123" cy="303" r="68" />
          <path d="M0 474C196 428 361 482 530 455C744 421 914 445 1200 401" />
        </g>
      </svg>
      <div className={styles.addressPlaque}>
        <span>Welcome home</span>
        <strong>{name.trim() || "Your name"}</strong>
      </div>
      <p className={styles.sceneDisclaimer}>An illustrated walkthrough, not a proposed design</p>
    </div>
  );
}

export function EntryScene({ activeAnchor }: SceneProps) {
  return (
    <div className={`${styles.scene} ${styles.entry}`} aria-hidden="true">
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <rect width="1200" height="650" fill="#f4efe5" />
        <path className={styles.lightWash} d="M760 92H1106V530H760Z" />
        <g className={styles.perspectiveLine}>
          <path d="M0 0L312 148H895L1200 0M0 650L312 500H895L1200 650" />
          <path d="M312 148V500M895 148V500" />
          <path d="M98 602L518 398M1101 602L690 398" />
        </g>
        <g className={styles.architecturalLine}>
          <path d="M760 92H1106V530H760ZM779 112H1086V510H779Z" />
          <path d="M455 317H700V498H455Z" />
          <path d="M490 317V279H664V317M505 498V522M650 498V522" />
          <path d="M118 289H328V500H118Z" />
          <path d="M139 310H307V478H139Z" />
        </g>
        <g className={styles.paperObjects}>
          <path d="M428 305L551 270L674 299L553 338Z" />
          <path d="M474 302L552 282L630 301L552 322Z" />
          <path d="M490 356L619 337L650 414L512 431Z" />
          <path d="M512 373L625 357M518 389L632 373M524 405L638 389" />
          <circle cx="439" cy="385" r="31" />
          <path d="M408 385H470M439 354V416" />
        </g>
        <g className={styles.landscapeLine}>
          <path d="M807 510V356M818 510V391M792 510V414" />
          <circle cx="807" cy="330" r="47" />
          <circle cx="864" cy="371" r="29" />
        </g>
      </svg>
      <Anchor id="rolled-plans" className={styles.rolledPlans} active={activeAnchor === "rolled-plans"} />
      <Anchor id="site-map" className={styles.siteMap} active={activeAnchor === "site-map"} />
      <Anchor id="landscape-window" className={styles.landscapeWindow} active={activeAnchor === "landscape-window"} />
      <div className={styles.sceneCaption}>
        <span>Entry study</span>
        <strong>{activeAnchor?.replaceAll("-", " ")}</strong>
      </div>
    </div>
  );
}

export function LivingRoomScene({ activeAnchor }: SceneProps) {
  return (
    <div className={`${styles.scene} ${styles.living}`} aria-hidden="true">
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <rect width="1200" height="650" fill="#f2eee5" />
        <path className={styles.lightWash} d="M75 102H411V408H75Z" />
        <g className={styles.perspectiveLine}>
          <path d="M0 0L234 142H956L1200 0M0 650L234 493H956L1200 650" />
          <path d="M234 142V493M956 142V493" />
          <path d="M234 493L468 350H746L956 493" />
        </g>
        <g className={styles.architecturalLine}>
          <path d="M75 102H411V408H75ZM95 122H391V388H95Z" />
          <path d="M819 154H1082V495H819Z" />
          <path d="M843 178H1058V495" />
          <path d="M474 302H762V422H474Z" />
          <path d="M446 422H790M495 422V463M741 422V463" />
          <path d="M291 351H451V472H291Z" />
          <path d="M315 351V314H427V351" />
          <path d="M887 495V216H1008V495M902 237H993" />
        </g>
        <g className={styles.rugLines}>
          <path d="M370 520L483 424H741L853 520Z" />
          <path d="M417 495L500 441H724L808 495Z" />
          <path d="M529 441V495M604 441V495M679 441V495" />
        </g>
        <g className={styles.materialBoard}>
          <path d="M704 184H794V293H704Z" />
          <path d="M716 197H751V240H716ZM757 197H782V240H757ZM716 247H782V281H716Z" />
        </g>
        <g className={styles.photoFrames}>
          <path d="M503 231H555V276H503ZM565 213H627V276H565ZM637 235H682V276H637Z" />
        </g>
      </svg>
      <Anchor id="floor-plan-rug" className={styles.floorPlanRug} active={activeAnchor === "floor-plan-rug"} />
      <Anchor id="stair" className={styles.stair} active={activeAnchor === "stair"} />
      <Anchor id="hall-doors" className={styles.hallDoors} active={activeAnchor === "hall-doors"} />
      <Anchor id="family-photos" className={styles.familyPhotos} active={activeAnchor === "family-photos"} />
      <Anchor id="seating" className={styles.seating} active={activeAnchor === "seating"} />
      <Anchor id="kitchen-opening" className={styles.kitchenOpening} active={activeAnchor === "kitchen-opening"} />
      <Anchor id="fireplace-window" className={styles.fireplaceWindow} active={activeAnchor === "fireplace-window"} />
      <Anchor id="finish-board" className={styles.finishBoard} active={activeAnchor === "finish-board"} />
      <div className={styles.sceneCaption}>
        <span>Living room study</span>
        <strong>{activeAnchor?.replaceAll("-", " ")}</strong>
      </div>
    </div>
  );
}
