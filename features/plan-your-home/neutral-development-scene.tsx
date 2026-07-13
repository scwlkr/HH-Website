import styles from "./neutral-development-scene.module.css";

export function NeutralDevelopmentScene() {
  return (
    <div className={styles.scene}>
      <svg
        className={styles.elevation}
        viewBox="0 0 1200 620"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <g className={styles.siteLines}>
          <path d="M-80 510C160 432 248 476 416 430C622 374 708 306 902 330C1034 346 1116 410 1282 378" />
          <path d="M-62 548C184 472 274 510 448 464C648 412 746 346 930 366C1068 380 1154 444 1294 420" />
          <path d="M14 586C224 526 320 552 488 510C668 464 776 406 958 418C1086 426 1174 478 1260 472" />
        </g>

        <g className={styles.houseMass}>
          <path d="M182 438V265L414 112L614 238V438" />
          <path d="M614 438V244L808 165L1032 286V438" />
          <path d="M150 270L410 92L642 242" />
          <path d="M586 246L806 142L1068 286" />
          <path d="M240 438V300H400V438" />
          <path d="M432 438V276H556V438" />
          <path d="M670 438V286H802V438" />
          <path d="M834 438V266H980V438" />
          <path d="M376 438V356H464V438" />
          <path d="M788 438V344H864V438" />
        </g>

        <g className={styles.dimensionLines}>
          <path d="M182 474H1032" />
          <path d="M182 462V486M1032 462V486" />
          <path d="M414 74V112M394 92H434" />
          <path d="M806 124V164M786 144H826" />
          <path d="M120 438H1084" />
        </g>

        <g className={styles.landscape}>
          <path d="M102 438V322M72 438L102 346L132 438" />
          <path d="M1110 438V304M1072 438L1110 328L1148 438" />
          <circle cx="102" cy="312" r="44" />
          <circle cx="1110" cy="292" r="58" />
        </g>

        <g className={styles.nodes}>
          <circle cx="182" cy="438" r="6" />
          <circle cx="414" cy="112" r="6" />
          <circle cx="614" cy="438" r="6" />
          <circle cx="806" cy="165" r="6" />
          <circle cx="1032" cy="438" r="6" />
        </g>
      </svg>

      <div className={styles.materialSample}>
        <span />
        <span />
        <span />
      </div>
      <div className={styles.titleBlock}>
        <span>Development study</span>
        <strong>Shared scene system</strong>
        <span>Not a proposed design</span>
      </div>
    </div>
  );
}
