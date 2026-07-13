import styles from "./kitchen-dining-scene.module.css";

type KitchenDiningSceneProps = Readonly<{
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

export function KitchenDiningScene({
  activeAnchor,
}: KitchenDiningSceneProps) {
  return (
    <div className={styles.scene} aria-hidden="true">
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="kitchen-light" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#f2ede3" />
            <stop offset="0.68" stopColor="#f8f4eb" />
            <stop offset="1" stopColor="#e3ebdf" />
          </linearGradient>
          <pattern
            id="kitchen-tile"
            width="26"
            height="14"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 13.5H26M13 0V13.5" />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="url(#kitchen-light)" />
        <path className={styles.ceilingWash} d="M0 0H1200L976 132H224Z" />

        <g className={styles.perspectiveLine}>
          <path d="M0 0L224 132H976L1200 0M0 650L224 490H976L1200 650" />
          <path d="M224 132V490M976 132V490" />
          <path d="M0 650L483 348M1200 650L720 348" />
          <path d="M224 490H976" />
        </g>

        <g className={styles.architecturalLine}>
          <path d="M116 184H467V450H116Z" />
          <path d="M136 204H447V430H136Z" />
          <path d="M151 219H432V304H151Z" fill="url(#kitchen-tile)" />
          <path d="M151 304H432M244 204V430M339 204V430" />
          <path d="M268 218H353V304M281 239H340V304" />
          <path d="M300 219V188H321V219" />
          <path d="M850 163H1091V486H850Z" />
          <path d="M874 190H1067V486M970 190V486" />
          <path d="M891 242H949V486M990 242H1048V486" />
          <path d="M472 368L731 322L864 421L563 484Z" />
          <path d="M495 372L730 336L834 414L566 467Z" />
          <path d="M553 484V525M819 431V470" />
          <path d="M632 350V452M702 339V437" />
        </g>

        <g className={styles.counterDetails}>
          <path d="M566 365L625 356L652 376L591 386Z" />
          <path d="M579 367C579 379 587 384 599 382C612 380 620 370 617 360" />
          <path d="M712 340V313M701 313H725M720 313V293" />
          <path d="M753 397L796 389M760 405L803 397" />
        </g>

        <g className={styles.diningLines}>
          <path d="M892 375L1002 350L1083 400L955 433Z" />
          <path d="M912 379V467M1057 394V472" />
          <path d="M925 449H986M1017 450H1070" />
          <path d="M918 337V295M943 332V286M1006 329V282M1031 336V291" />
          <path d="M902 295H950M990 286H1039" />
          <path d="M975 163V119M953 119H998" />
          <path d="M959 120L938 178H1013L993 120" />
        </g>

        <g className={styles.greenery}>
          <path d="M1051 486V416M1034 486L1048 434M1068 486L1056 438" />
          <path d="M1017 416C1032 390 1048 394 1052 423C1066 394 1082 400 1065 438C1088 424 1095 444 1064 454" />
        </g>
      </svg>

      <Anchor
        id="range-and-island"
        className={styles.rangeAndIsland}
        active={activeAnchor === "range-and-island"}
      />
      <Anchor
        id="room-opening"
        className={styles.roomOpening}
        active={activeAnchor === "room-opening"}
      />
      <Anchor
        id="pantry-door"
        className={styles.pantryDoor}
        active={activeAnchor === "pantry-door"}
      />
      <Anchor
        id="dining-table"
        className={styles.diningTable}
        active={activeAnchor === "dining-table"}
      />

      <div className={styles.sceneCaption}>
        <span>Kitchen and dining study</span>
        <strong>{activeAnchor?.replaceAll("-", " ")}</strong>
      </div>
    </div>
  );
}

export function PrimaryHallThresholdScene() {
  return (
    <div className={styles.threshold} aria-hidden="true">
      <KitchenDiningScene activeAnchor="dining-table" />
      <div className={styles.hallReveal}>
        <span>Primary hall</span>
      </div>
    </div>
  );
}
