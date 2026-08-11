import styles from "./design-desk-scene.module.css";

type DesignDeskSceneProps = Readonly<{ activeAnchor?: string }>;

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

export function DesignDeskScene({ activeAnchor }: DesignDeskSceneProps) {
  return (
    <div
      className={styles.scene}
      data-scene-variant="design-desk"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 650" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="desk-paper" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f7f1e5" />
            <stop offset="1" stopColor="#ddd6c7" />
          </linearGradient>
          <linearGradient id="desk-board" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d5e0da" />
            <stop offset="1" stopColor="#a9beb2" />
          </linearGradient>
          <pattern id="desk-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" />
          </pattern>
        </defs>
        <rect width="1200" height="650" fill="url(#desk-paper)" />
        <path className={styles.wallLine} d="M0 110H1200M0 514H1200" />
        <path className={styles.deskFill} d="M0 475L1200 424V650H0Z" />

        <g className={styles.board}>
          <path d="M85 78H525V374H85Z" fill="url(#desk-board)" />
          <path d="M111 108H251V213H111ZM275 105H493V196H275ZM128 239H305V338H128ZM330 224H478V340H330Z" />
          <path className={styles.swatch} d="M137 129H181V174H137ZM193 129H229V174H193ZM300 128H356V172H300ZM369 128H421V172H369ZM436 128H471V172H436Z" />
          <path d="M148 269C188 233 239 250 278 305M352 248L448 315M358 315L447 250" />
          <circle cx="112" cy="108" r="5" /><circle cx="493" cy="105" r="5" />
          <circle cx="128" cy="239" r="5" /><circle cx="478" cy="224" r="5" />
        </g>

        <g className={styles.scanner}>
          <path d="M735 119H1082V341H735Z" />
          <path d="M767 151H1047V307H767Z" />
          <path d="M806 180H1007V270H806ZM842 201H974M842 224H952M842 247H982" />
          <path d="M704 351H1111L1074 403H739Z" />
          <path d="M742 365H1073M769 383H1046" />
        </g>

        <g className={styles.prioritySheets}>
          <path d="M113 470L384 446L411 592L140 616Z" />
          <path d="M145 459L421 472L413 607L137 594Z" />
          <path d="M179 448L456 488L435 617L158 577Z" />
          <path d="M212 490L396 515M203 523L385 548M195 554L371 579" />
          <path className={styles.greenMark} d="M174 491L185 502L204 477M165 526L176 537L195 512M156 559L167 570L186 545" />
        </g>

        <g className={styles.rulerCalendar}>
          <path d="M516 452L884 438L892 488L523 502Z" />
          <path d="M552 451L555 474M594 449L596 471M637 448L638 470M680 446L682 468M724 444L726 466M768 443L770 465M812 441L814 463M856 440L858 461" />
          <path d="M824 514H1094V621H824Z" />
          <path d="M824 544H1094M878 544V621M932 544V621M986 544V621M1040 544V621M824 570H1094M824 596H1094" />
          <path className={styles.greenMark} d="M885 580L895 589L913 568M993 555L1003 564L1021 543" />
        </g>

        <g className={styles.draftingMarks}>
          <path d="M40 54H82M61 33V75M1121 57H1164M1143 36V78M579 95L645 95M612 62V128" />
          <path d="M569 156C623 128 673 131 710 164M554 195C622 171 674 174 719 205" />
          <path className={styles.grid} d="M539 231H697V360H539Z" />
        </g>
      </svg>

      <Anchor id="mood-board" className={styles.moodBoard} active={activeAnchor === "mood-board"} />
      <Anchor id="pinboard-scanner" className={styles.pinboardScanner} active={activeAnchor === "pinboard-scanner"} />
      <Anchor id="priority-stacks" className={styles.priorityStacks} active={activeAnchor === "priority-stacks"} />
      <Anchor id="ruler-calendar" className={styles.calendar} active={activeAnchor === "ruler-calendar"} />

      <div className={styles.caption}>
        <span>Fixed design desk study</span>
        <strong>{activeAnchor?.replaceAll("-", " ")}</strong>
      </div>
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
