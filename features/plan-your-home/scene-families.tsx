import styles from "./scene-families.module.css";

type SceneProps = Readonly<{
  activeAnchor?: string;
}>;

type Family =
  | "front-door-site"
  | "living-kitchen-dining"
  | "bedrooms-bathrooms"
  | "utility-exterior-outdoor"
  | "design-desk-review";

function FamilyArtwork({ family }: Readonly<{ family: Family }>) {
  if (family === "front-door-site") {
    return (
      <>
        <path className={styles.wash} d="M0 433C212 383 399 420 583 384C777 346 980 388 1200 329V650H0Z" />
        <path className={styles.warmWash} d="M229 444V283L532 117L835 286V444Z" />
        <path className={styles.glass} d="M652 271H784V396H652Z" />
        <g className={styles.ink}>
          <path d="M167 299L532 92L902 301" />
          <path d="M229 444V283M835 444V286M229 444H835" />
          <path d="M430 444V276H589V444M652 444V271H784V444" />
          <path d="M0 471C229 431 404 476 612 427C811 381 1002 420 1200 365" />
        </g>
        <g className={styles.detail}>
          <path d="M718 271V396M652 334H784" />
        </g>
      </>
    );
  }

  if (family === "living-kitchen-dining") {
    return (
      <>
        <path className={styles.wash} d="M0 650V468L238 355H956L1200 650Z" />
        <path className={styles.glass} d="M95 104H385V340H95Z" />
        <path className={styles.warmWash} d="M423 340H767V454H423Z" />
        <g className={styles.ink}>
          <path d="M0 0L238 128H956L1200 0M238 128V468M956 128V468" />
          <path d="M95 104H385V340H95ZM116 125H364V319H116Z" />
          <path d="M423 340H767V454H423ZM393 454H797M458 454V495M735 454V495" />
          <path d="M843 187H1102V468M866 210H1079V468M866 319H1079" />
        </g>
        <g className={styles.detail}>
          <path d="M240 125V319M116 222H364" />
          <path d="M483 340L524 292H669L710 340M513 310H677" />
          <path d="M895 319V468M998 319V468" />
        </g>
      </>
    );
  }

  if (family === "bedrooms-bathrooms") {
    return (
      <>
        <path className={styles.wash} d="M0 650V481L285 348H922L1200 650Z" />
        <path className={styles.warmWash} d="M227 320H568V478H227Z" />
        <path className={styles.glass} d="M759 142H1083V376H759Z" />
        <g className={styles.ink}>
          <path d="M0 0L285 135H922L1200 0M285 135V481M922 135V481" />
          <path d="M227 320H568V478M257 343H538V456H257Z" />
          <path d="M759 142H1083V376H759ZM782 165H1060V353H782Z" />
          <path d="M636 236H724V481M658 259H702V481" />
        </g>
        <g className={styles.detail}>
          <path d="M288 343L351 286H454L516 343M343 307H458" />
          <path d="M921 165V353M782 259H1060" />
          <path d="M660 296H700" />
        </g>
      </>
    );
  }

  if (family === "utility-exterior-outdoor") {
    return (
      <>
        <path className={styles.wash} d="M0 436C202 392 413 428 601 389C792 350 1009 394 1200 347V650H0Z" />
        <path className={styles.warmWash} d="M162 454V296L454 145L729 298V454Z" />
        <path className={styles.glass} d="M776 286H1059V454H776Z" />
        <g className={styles.ink}>
          <path d="M103 308L454 119L794 310M713 307L900 204L1108 309" />
          <path d="M162 454V296M729 454V298M776 454V286M1059 454V286" />
          <path d="M239 454V318H390V454M485 454V308H650V454" />
          <path d="M776 454H1059M806 316H1029V454" />
        </g>
        <g className={styles.detail}>
          <path d="M318 318V454M239 382H390M876 316V454M958 316V454" />
          <path d="M700 495H1120M756 531H1064" />
          <path d="M111 454V350M75 454L111 384L148 454" />
          <circle cx="111" cy="333" r="39" />
        </g>
      </>
    );
  }

  return (
    <>
      <path className={styles.wash} d="M0 650V448L235 359H977L1200 650Z" />
      <path className={styles.warmWash} d="M278 399L807 382L851 580L325 601Z" />
      <path className={styles.glass} d="M741 82H1092V301H741Z" />
      <g className={styles.ink}>
        <path d="M0 0L235 126H977L1200 0M235 126V448M977 126V448" />
        <path d="M90 94H525V319H90ZM116 119H499V294H116Z" />
        <path d="M278 399L807 382L851 580L325 601Z" />
        <path d="M352 447L492 442L499 523L360 529M499 442L684 436L696 518L499 523" />
        <path d="M741 82H1092V301H741ZM916 82V301" />
      </g>
      <g className={styles.detail}>
        <path d="M149 169H249V232H149ZM280 145H438V252H280Z" />
        <path d="M767 266L846 204L935 266M911 238L1000 168L1070 231" />
        <path d="M731 395L815 339" />
      </g>
    </>
  );
}

function SketchScene({
  family,
  activeAnchor,
  variant,
  name,
}: Readonly<{
  family: Family;
  activeAnchor?: string;
  variant: string;
  name?: string;
}>) {
  return (
    <div
      className={styles.scene}
      data-active-anchor={activeAnchor}
      data-scene-family={family}
      data-scene-variant={variant}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <rect className={styles.paper} width="1200" height="650" />
        <FamilyArtwork family={family} />
      </svg>
      {name !== undefined ? (
        <div className={styles.plaque}>
          <span>Welcome home</span>
          <strong>{name.trim() || "Your name"}</strong>
        </div>
      ) : null}
    </div>
  );
}

export function WelcomeExteriorScene({ name }: Readonly<{ name: string }>) {
  return <SketchScene family="front-door-site" variant="welcome-exterior" name={name} />;
}

export function EntryScene({ activeAnchor }: SceneProps) {
  return <SketchScene family="front-door-site" variant="front-door-site" activeAnchor={activeAnchor} />;
}

export function LivingRoomScene({ activeAnchor }: SceneProps) {
  return <SketchScene family="living-kitchen-dining" variant="living-room-study" activeAnchor={activeAnchor} />;
}

export function KitchenDiningScene({ activeAnchor }: SceneProps) {
  return <SketchScene family="living-kitchen-dining" variant="kitchen-dining-study" activeAnchor={activeAnchor} />;
}

export function PrimarySuiteScene({ activeAnchor }: SceneProps) {
  return <SketchScene family="bedrooms-bathrooms" variant="primary-suite" activeAnchor={activeAnchor} />;
}

export function BedroomsSharedBathroomsScene({ activeAnchor }: SceneProps) {
  return <SketchScene family="bedrooms-bathrooms" variant="representative-bedroom-hall" activeAnchor={activeAnchor} />;
}
export function BedroomHallThresholdScene() {
  return <PrimarySuiteScene />;
}
export function UtilityHallThresholdScene() {
  return <PrimarySuiteScene />;
}

export function UtilitySystemsScene({ activeAnchor }: SceneProps) {
  return <SketchScene family="utility-exterior-outdoor" variant="utility-hall" activeAnchor={activeAnchor} />;
}

export function ExteriorSiteScene({ activeAnchor }: SceneProps) {
  return <SketchScene family="utility-exterior-outdoor" variant="exterior-site-study" activeAnchor={activeAnchor} />;
}
export function ExteriorBackDoorThresholdScene() {
  return <SketchScene family="utility-exterior-outdoor" variant="exterior" />;
}
export function BlueprintDesignDeskThresholdScene() {
  return <SketchScene family="design-desk-review" variant="blueprint-design-desk-threshold" />;
}

export function DesignDeskScene({ activeAnchor }: SceneProps) {
  return <SketchScene family="design-desk-review" variant="design-desk" activeAnchor={activeAnchor} />;
}

export function ReviewBriefThresholdScene() {
  return <DesignDeskScene activeAnchor="review-brief" />;
}
