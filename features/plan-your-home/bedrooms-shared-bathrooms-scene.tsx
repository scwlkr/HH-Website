import styles from "./bedrooms-shared-bathrooms-scene.module.css";

type BedroomsSharedBathroomsSceneProps = Readonly<{
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

export function BedroomsSharedBathroomsScene({
  activeAnchor,
}: BedroomsSharedBathroomsSceneProps) {
  return (
    <div
      className={styles.scene}
      data-scene-variant="representative-bedroom-hall"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="secondary-hall-light" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#e7eadf" />
            <stop offset="0.54" stopColor="#f8f2e7" />
            <stop offset="1" stopColor="#e8eee7" />
          </linearGradient>
          <linearGradient id="secondary-bath-light" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2ede9" />
            <stop offset="1" stopColor="#f3eadf" />
          </linearGradient>
          <pattern id="secondary-bath-tile" width="28" height="18" patternUnits="userSpaceOnUse">
            <path d="M0 17.5H28M27.5 0V18" />
          </pattern>
        </defs>

        <rect width="1200" height="650" fill="url(#secondary-hall-light)" />
        <path className={styles.ceilingWash} d="M0 0H1200L956 132H242Z" />

        <g className={styles.perspectiveLine}>
          <path d="M0 0L242 132H956L1200 0M0 650L242 494H956L1200 650" />
          <path d="M242 132V494M956 132V494M0 650L518 350M1200 650L683 350" />
          <path d="M242 494H956M518 350H683" />
        </g>

        <g className={styles.architecturalLine}>
          <path d="M62 176H310V494H62Z" />
          <path d="M91 204H281V494M186 204V494" />
          <path d="M116 273H164M211 273H259" />
          <path d="M104 176V145H269V176M142 145V128H231V145" />

          <path d="M342 154H551V494H342Z" />
          <path d="M369 184H524V494M447 184V494" />
          <path d="M388 261H427M468 261H506" />

          <path d="M628 158H1140V494H628Z" fill="url(#secondary-bath-light)" />
          <path d="M654 184H1114V494M884 184V494" />
          <path d="M655 184H1113V343H655Z" fill="url(#secondary-bath-tile)" />
          <path d="M682 209H855V494M911 209H1086V494" />
          <path d="M704 278H832M934 278H1064" />
          <path d="M745 209V278M1001 209V278" />
          <path d="M698 394H1071V494M728 414H1041V494" />
          <path d="M771 414V494M885 414V494M998 414V494" />
        </g>

        <g className={styles.bathDetails}>
          <path d="M752 393C752 414 770 426 798 426C826 426 844 414 844 393" />
          <path d="M924 393C924 414 943 426 970 426C998 426 1016 414 1016 393" />
          <path d="M798 393V362M785 362H812M807 362V340" />
          <path d="M970 393V362M957 362H984M979 362V340" />
          <path d="M646 184L618 151M1122 184L1151 151" />
        </g>

        <g className={styles.materialDetails}>
          <path d="M62 494H1140M61 503H1141" />
          <path d="M322 494L277 538M343 494L299 538" />
          <path d="M884 494L884 542M860 518H908" />
        </g>
      </svg>

      <Anchor
        id="bedroom-door-cluster"
        className={styles.bedroomDoorCluster}
        active={activeAnchor === "bedroom-door-cluster"}
      />
      <Anchor
        id="shared-bath-vanity"
        className={styles.sharedBathVanity}
        active={activeAnchor === "shared-bath-vanity"}
      />

      <div className={styles.sceneCaption}>
        <span>Representative bedroom hall study</span>
        <strong>{activeAnchor?.replaceAll("-", " ")}</strong>
      </div>
    </div>
  );
}

export function UtilityHallThresholdScene() {
  return (
    <div className={styles.threshold} aria-hidden="true">
      <BedroomsSharedBathroomsScene activeAnchor="shared-bath-vanity" />
      <div className={styles.utilityReveal}>
        <span>Utility hall</span>
      </div>
    </div>
  );
}
