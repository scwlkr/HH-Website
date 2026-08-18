import type { ReactNode } from "react";
import styles from "./exterior-style-sketches.module.css";

function ElevationFrame({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <svg
      aria-hidden="true"
      className={styles.sketch}
      data-exterior-style-sketch
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 320 176"
    >
      <path className={styles.ground} d="M17 149H303M31 157H286" />
      <path
        className={styles.construction}
        d="M23 31H297M38 22V157M282 22V157"
      />
      {children}
    </svg>
  );
}

function AcadianElevation() {
  return (
    <ElevationFrame>
      <path className={styles.wall} d="M53 69H267V141H53Z" />
      <path className={styles.metal} d="M37 72L79 29H241L283 72L267 76H53Z" />
      <path className={styles.shadow} d="M43 98H277V111H43Z" />
      <g className={styles.ink}>
        <path d="M34 73L78 25H242L286 73M53 72V141H267V72" />
        <path d="M43 98H277M48 98V141M272 98V141" />
        <path d="M72 99V141M111 99V141M160 94V141M209 99V141M248 99V141" />
        <path d="M143 141V105H177V141M78 112H101V137H78ZM219 112H242V137H219Z" />
        <path d="M62 141V150M92 141V150M228 141V150M258 141V150" />
      </g>
      <g className={styles.detail}>
        <path d="M91 29L103 53H126L137 29M183 29L194 53H218L229 29" />
        <path d="M100 53V70M194 53V70M83 112V137M96 112V137M224 112V137M237 112V137" />
      </g>
    </ElevationFrame>
  );
}

function BarndominiumElevation() {
  return (
    <ElevationFrame>
      <path className={styles.metal} d="M45 64L151 17L259 64V149H45Z" />
      <path className={styles.wood} d="M69 80H168V149H69Z" />
      <path className={styles.wall} d="M178 91H282V149H178Z" />
      <g className={styles.ink}>
        <path d="M32 69L151 12L272 69M45 64V149H259V64" />
        <path d="M69 149V80H168V149M118 80V149" />
        <path d="M178 91H282V149M171 91L209 69H291" />
        <path d="M198 149V103H223V149M239 105H271V133H239Z" />
      </g>
      <g className={styles.detail}>
        <path d="M55 60V147M65 55V147M239 54V147M249 59V147" />
        <path d="M72 83L165 146M165 83L72 146M178 91V149M282 91V149" />
      </g>
    </ElevationFrame>
  );
}

function CapeCodElevation() {
  return (
    <ElevationFrame>
      <path className={styles.shingle} d="M45 83L160 27L275 83L259 88H61Z" />
      <path className={styles.wall} d="M61 83H259V149H61Z" />
      <path className={styles.brick} d="M194 38H215V82H194Z" />
      <g className={styles.ink}>
        <path d="M42 85L160 23L278 85M61 83V149H259V83" />
        <path d="M145 149V108H175V149" />
        <path d="M83 108H111V136H83ZM209 108H237V136H209Z" />
        <path d="M194 38V73M215 38V82" />
      </g>
      <g className={styles.detail}>
        <path d="M91 108V136M103 108V136M217 108V136M229 108V136" />
        <path d="M70 105L82 96H112L124 105M196 105L208 96H238L250 105" />
        <path d="M82 55L100 42L118 55V81M202 55L220 42L238 55V81" />
        <path d="M154 123H166M77 108V136M117 108V136M203 108V136M243 108V136" />
      </g>
    </ElevationFrame>
  );
}

function ColonialRevivalElevation() {
  return (
    <ElevationFrame>
      <path className={styles.brick} d="M63 57H257V149H63Z" />
      <path className={styles.shingle} d="M48 61L79 34H241L272 61Z" />
      <path className={styles.wall} d="M129 104L160 81L191 104V149H129Z" />
      <g className={styles.ink}>
        <path d="M47 61L78 31H242L273 61M63 57V149H257V57" />
        <path d="M129 149V104L160 78L191 104V149" />
        <path d="M147 149V112H173V149M80 73H103V96H80ZM217 73H240V96H217Z" />
        <path d="M80 111H103V137H80ZM217 111H240V137H217Z" />
        <path d="M136 105V149M184 105V149" />
      </g>
      <g className={styles.detail}>
        <path d="M87 73V96M96 73V96M224 73V96M233 73V96M87 111V137M96 111V137M224 111V137M233 111V137" />
        <path d="M143 102L160 91L177 102M151 110C151 99 169 99 169 110" />
        <path d="M72 64H248M74 101H246" />
      </g>
    </ElevationFrame>
  );
}

function ContemporaryElevation() {
  return (
    <ElevationFrame>
      <path className={styles.stone} d="M39 68H144V149H39Z" />
      <path className={styles.wall} d="M136 42H252V149H136Z" />
      <path className={styles.wood} d="M241 71H288V149H241Z" />
      <path className={styles.glass} d="M54 87H128V134H54ZM153 61H232V117H153Z" />
      <g className={styles.ink}>
        <path d="M31 67H146V38H254V68H289M39 149V68M136 149V42M252 149V42M288 149V71" />
        <path d="M54 149V87H128V149M153 149V61H232V149" />
        <path d="M241 149V71H288" />
      </g>
      <g className={styles.detail}>
        <path d="M79 87V134M103 87V134M178 61V117M205 61V117" />
        <path d="M24 77L133 56M253 54L297 80M145 125H241" />
        <path d="M245 78H283M245 88H283M245 98H283M245 108H283M245 118H283" />
      </g>
    </ElevationFrame>
  );
}

function CraftsmanElevation() {
  return (
    <ElevationFrame>
      <path className={styles.shingle} d="M34 79L106 31H218L286 79L270 84H50Z" />
      <path className={styles.wall} d="M54 79H266V149H54Z" />
      <path className={styles.stone} d="M61 122H91V149H61ZM229 122H259V149H229Z" />
      <path className={styles.wood} d="M90 102H230V112H90Z" />
      <g className={styles.ink}>
        <path d="M30 81L104 27H220L290 81M54 79V149H266V79" />
        <path d="M78 122L88 101H102L113 122M207 122L218 101H232L242 122" />
        <path d="M90 102H230M75 149V122M245 149V122" />
        <path d="M142 149V108H174V149M109 116H132V139H109ZM188 116H211V139H188Z" />
      </g>
      <g className={styles.detail}>
        <path d="M56 75L46 91M76 67L66 84M244 67L254 84M264 75L274 91" />
        <path d="M99 57L126 40L154 57V81M113 116V139M126 116V139M192 116V139M205 116V139" />
        <path d="M88 101L72 91M102 101L113 88M218 101L207 88M232 101L248 91" />
      </g>
    </ElevationFrame>
  );
}

function FrenchCountryElevation() {
  return (
    <ElevationFrame>
      <path className={styles.stone} d="M48 72H272V149H48Z" />
      <path className={styles.shingle} d="M35 77L75 25H137L157 70L178 28H243L285 77Z" />
      <path className={styles.stucco} d="M130 60H191V149H130Z" />
      <g className={styles.ink}>
        <path d="M33 78L73 22H139L158 67L176 25H245L288 78" />
        <path d="M48 72V149H272V72M130 60V149H191V60" />
        <path d="M145 149V107C145 89 176 89 176 107V149" />
        <path d="M68 105H96V138H68ZM224 105H252V138H224Z" />
        <path d="M91 25V64M112 19V69M217 21V64M237 29V69" />
      </g>
      <g className={styles.detail}>
        <path d="M73 57L91 43L109 57V76M211 57L229 42L247 57V76" />
        <path d="M73 105V138M91 105V138M229 105V138M247 105V138" />
        <path d="M58 98L68 91H96L106 98M214 98L224 91H252L262 98" />
      </g>
    </ElevationFrame>
  );
}

function GreekRevivalElevation() {
  return (
    <ElevationFrame>
      <path className={styles.wall} d="M54 65H266V149H54Z" />
      <path className={styles.stucco} d="M42 68L160 25L278 68Z" />
      <path className={styles.shadow} d="M42 74H278V87H42Z" />
      <g className={styles.ink}>
        <path d="M38 69L160 21L282 69M48 74H272M54 65V149H266V65" />
        <path d="M67 83V149M105 83V149M143 83V149M181 83V149M219 83V149M257 83V149" />
        <path d="M149 149V105H175V149" />
        <path d="M79 103H98V134H79ZM222 103H241V134H222Z" />
      </g>
      <g className={styles.detail}>
        <path d="M59 82H266M60 89H265M63 141H261" />
        <path d="M83 103V134M94 103V134M226 103V134M237 103V134" />
        <path d="M151 103C151 93 173 93 173 103M143 104H181" />
      </g>
    </ElevationFrame>
  );
}

function MediterraneanElevation() {
  return (
    <ElevationFrame>
      <path className={styles.stucco} d="M48 57H272V149H48Z" />
      <path className={styles.tile} d="M37 61L72 34H248L283 61Z" />
      <path className={styles.stone} d="M103 103H217V149H103Z" />
      <g className={styles.ink}>
        <path d="M34 62L70 31H250L286 62M48 57V149H272V57" />
        <path d="M103 149V113C103 91 135 91 135 113V149M142 149V113C142 91 176 91 176 113V149M184 149V113C184 91 217 91 217 113V149" />
        <path d="M72 75H99V99H72ZM221 75H248V99H221Z" />
        <path d="M121 77H199V95H121Z" />
      </g>
      <g className={styles.detail}>
        <path d="M42 58C82 49 118 52 160 58C202 51 240 50 278 58" />
        <path d="M82 75V99M90 75V99M230 75V99M239 75V99" />
        <path d="M127 77V95M143 77V95M160 77V95M177 77V95M193 77V95" />
        <path d="M113 106H207M111 119H209" />
      </g>
    </ElevationFrame>
  );
}

function MidCenturyModernElevation() {
  return (
    <ElevationFrame>
      <path className={styles.wood} d="M42 79H187V149H42Z" />
      <path className={styles.brick} d="M187 61H272V149H187Z" />
      <path className={styles.glass} d="M78 91H177V137H78ZM199 78H260V118H199Z" />
      <path className={styles.shadow} d="M27 117H75V149H27Z" />
      <g className={styles.ink}>
        <path d="M29 82L188 51L285 68M42 149V79M187 149V61M272 149V66" />
        <path d="M78 149V91H177V149M199 149V78H260V149" />
        <path d="M27 117H75V149M31 117V149M70 117V149" />
      </g>
      <g className={styles.detail}>
        <path d="M101 91V137M126 91V137M151 91V137M219 78V118M240 78V118" />
        <path d="M51 72V149M60 69V149M187 68H272" />
        <path d="M31 124H70M31 133H70M31 142H70" />
      </g>
    </ElevationFrame>
  );
}

function ModernElevation() {
  return (
    <ElevationFrame>
      <path className={styles.wall} d="M38 57H166V149H38Z" />
      <path className={styles.stone} d="M157 35H265V149H157Z" />
      <path className={styles.glass} d="M55 77H145V113H55ZM178 54H248V132H178Z" />
      <path className={styles.metal} d="M107 121H189V149H107Z" />
      <g className={styles.ink}>
        <path d="M30 56H171V32H269M38 149V57M166 149V35M265 149V35" />
        <path d="M55 149V77H145V149M178 149V54H248V149" />
        <path d="M107 121H189V149M157 35V149" />
      </g>
      <g className={styles.detail}>
        <path d="M77 77V113M100 77V113M123 77V113M201 54V132M225 54V132" />
        <path d="M25 64H155M172 42H277M103 116H195" />
      </g>
    </ElevationFrame>
  );
}

function ModernFarmhouseElevation() {
  return (
    <ElevationFrame>
      <path className={styles.wall} d="M45 72H273V149H45Z" />
      <path className={styles.metal} d="M32 75L91 18L151 75L202 31L286 75Z" />
      <path className={styles.shadow} d="M67 103H258V115H67Z" />
      <g className={styles.ink}>
        <path d="M29 77L91 14L154 77M145 77L202 27L289 77" />
        <path d="M45 72V149H273V72" />
        <path d="M67 103H258M73 103V149M251 103V149" />
        <path d="M139 149V104H170V149M82 111H110V140H82ZM204 109H233V140H204Z" />
      </g>
      <g className={styles.detail}>
        <path d="M54 68V147M65 57V147M119 43V147M130 55V147M187 41V147M198 34V147M263 64V147" />
        <path d="M89 111V140M102 111V140M211 109V140M226 109V140" />
        <path d="M70 103L61 93M255 103L265 93" />
      </g>
    </ElevationFrame>
  );
}

function PrairieElevation() {
  return (
    <ElevationFrame>
      <path className={styles.brick} d="M39 83H281V149H39Z" />
      <path className={styles.stucco} d="M80 61H240V118H80Z" />
      <path className={styles.shingle} d="M25 86L72 67H248L295 86Z" />
      <path className={styles.shingle} d="M66 65L104 39H216L254 65Z" />
      <path className={styles.glass} d="M101 79H220V105H101Z" />
      <g className={styles.ink}>
        <path d="M23 87L70 64H250L297 87M65 66L102 36H218L255 66" />
        <path d="M39 83V149H281V83M80 61V118H240V61" />
        <path d="M101 79H220V105H101ZM65 111H91V139H65ZM230 111H256V139H230Z" />
        <path d="M121 149V116H151V149M181 116V149" />
      </g>
      <g className={styles.detail}>
        <path d="M75 70H245M47 94H273M45 101H275M50 141H270" />
        <path d="M121 79V105M141 79V105M161 79V105M181 79V105M201 79V105" />
      </g>
    </ElevationFrame>
  );
}

function QueenAnneElevation() {
  return (
    <ElevationFrame>
      <path className={styles.wall} d="M51 67H241V149H51Z" />
      <path className={styles.shingle} d="M35 70L88 25L142 70L195 38L256 72Z" />
      <path className={styles.wood} d="M216 57H270V149H216Z" />
      <path className={styles.shingle} d="M207 60Q243 5 279 60Z" />
      <path className={styles.shadow} d="M38 111H261V122H38Z" />
      <g className={styles.ink}>
        <path d="M32 72L88 21L145 72M137 72L194 34L259 73M204 61Q243 4 282 61" />
        <path d="M51 67V149H241V67M213 58V149H276V58" />
        <path d="M38 111H261M45 111V149M254 111V149" />
        <path d="M75 149V119M105 149V119M143 149V106H172V149M193 149V118M229 149V116" />
        <path d="M74 78H101V103H74ZM231 75C231 60 255 60 255 75C255 90 231 90 231 75Z" />
        <path d="M220 101H266V132H220Z" />
      </g>
      <g className={styles.detail}>
        <path d="M49 122H253M54 131H248M58 140H244" />
        <path d="M48 111L57 101M75 111L84 101M102 111L111 101M198 111L207 101M226 111L235 101M253 111L262 101" />
        <path d="M81 78V103M94 78V103M243 62V88M231 75H255" />
        <path d="M217 62H271M218 68H270M231 101V132M243 101V132M255 101V132" />
        <path d="M214 57L243 40L272 57M219 50L243 32L267 50" />
      </g>
    </ElevationFrame>
  );
}

function RanchElevation() {
  return (
    <ElevationFrame>
      <path className={styles.brick} d="M34 84H286V149H34Z" />
      <path className={styles.shingle} d="M22 87L70 58H249L298 87Z" />
      <path className={styles.stone} d="M120 86H156V149H120Z" />
      <path className={styles.glass} d="M170 101H235V137H170Z" />
      <g className={styles.ink}>
        <path d="M20 88L68 55H251L300 88M34 84V149H286V84" />
        <path d="M49 149V101H108V149M120 149V86H156V149" />
        <path d="M170 149V101H235V149M250 149V106H275V149" />
        <path d="M59 110H98M59 121H98M59 132H98" />
      </g>
      <g className={styles.detail}>
        <path d="M47 94H111M163 94H279M191 101V137M214 101V137" />
        <path d="M127 86V149M149 86V149M245 101L252 94H276L284 101" />
      </g>
    </ElevationFrame>
  );
}

function SpanishColonialElevation() {
  return (
    <ElevationFrame>
      <path className={styles.stucco} d="M37 71H280V149H37Z" />
      <path className={styles.tile} d="M28 74L75 46H155L178 64L214 37H271L291 74Z" />
      <path className={styles.wood} d="M133 149V105C133 80 177 80 177 105V149Z" />
      <g className={styles.ink}>
        <path d="M25 76L73 43H157L178 61L212 34H273L294 76" />
        <path d="M37 71V149H280V71" />
        <path d="M56 149V112C56 92 86 92 86 112V149M94 149V112C94 92 124 92 124 112V149" />
        <path d="M133 149V105C133 80 177 80 177 105V149" />
        <path d="M213 103H258V136H213Z" />
      </g>
      <g className={styles.detail}>
        <path d="M33 71C73 61 112 65 156 71M181 69C218 61 251 63 286 72" />
        <path d="M143 107L168 91M145 121L173 102M222 103V136M238 103V136M251 103V136" />
        <path d="M45 82H116M193 78H268" />
      </g>
    </ElevationFrame>
  );
}

function TexasHillCountryElevation() {
  return (
    <ElevationFrame>
      <path className={styles.stone} d="M34 82H163V149H34Z" />
      <path className={styles.wood} d="M153 93H287V149H153Z" />
      <path className={styles.metal} d="M22 85L87 42H151L176 83Z" />
      <path className={styles.metal} d="M139 96L205 55H268L298 96Z" />
      <path className={styles.shadow} d="M151 105H286V116H151Z" />
      <g className={styles.ink}>
        <path d="M19 87L85 39H153L179 85M136 98L203 52H270L301 98" />
        <path d="M34 82V149H163V82M153 93V149H287V93" />
        <path d="M151 105H286M160 105V149M279 105V149" />
        <path d="M57 149V103H91V149M109 106H142V137H109Z" />
        <path d="M186 149V111H211V149M230 112H264V138H230Z" />
      </g>
      <g className={styles.detail}>
        <path d="M39 98L56 91L73 98L91 90L108 99L126 91L145 99" />
        <path d="M177 105L164 94M269 105L282 94M237 112V138M255 112V138" />
        <path d="M66 103V149M82 103V149M192 111V149M205 111V149" />
      </g>
    </ElevationFrame>
  );
}

function TudorRevivalElevation() {
  return (
    <ElevationFrame>
      <path className={styles.brick} d="M42 76H270V149H42Z" />
      <path className={styles.stucco} d="M64 69L125 19L188 69V149H64Z" />
      <path className={styles.shingle} d="M31 80L124 13L195 72L230 40L285 80Z" />
      <path className={styles.stone} d="M207 45H234V149H207Z" />
      <g className={styles.ink}>
        <path d="M28 82L124 10L197 74M181 77L229 36L289 82" />
        <path d="M42 76V149H270V76M64 69V149H188V69" />
        <path d="M207 149V45H234V149M80 149V105C80 85 111 85 111 105V149" />
        <path d="M132 95H158V135H132ZM242 102H261V136H242Z" />
      </g>
      <g className={styles.detail}>
        <path d="M78 65L123 28L174 68M88 54V82M104 43V90M143 41V90M160 54V83" />
        <path d="M82 66L166 66M92 89L154 44M153 89L95 44" />
        <path d="M138 95V135M152 95V135M246 102V136M257 102V136" />
        <path d="M203 62H238M203 77H238" />
      </g>
    </ElevationFrame>
  );
}

export function ExteriorStyleSketch({ slug }: Readonly<{ slug: string }>) {
  switch (slug) {
    case "acadian":
      return <AcadianElevation />;
    case "barndominium":
      return <BarndominiumElevation />;
    case "cape-cod":
      return <CapeCodElevation />;
    case "colonial-revival":
      return <ColonialRevivalElevation />;
    case "contemporary":
      return <ContemporaryElevation />;
    case "craftsman":
      return <CraftsmanElevation />;
    case "french-country":
      return <FrenchCountryElevation />;
    case "greek-revival":
      return <GreekRevivalElevation />;
    case "mediterranean":
      return <MediterraneanElevation />;
    case "mid-century-modern":
      return <MidCenturyModernElevation />;
    case "modern":
      return <ModernElevation />;
    case "modern-farmhouse":
      return <ModernFarmhouseElevation />;
    case "prairie":
      return <PrairieElevation />;
    case "queen-anne":
      return <QueenAnneElevation />;
    case "ranch":
      return <RanchElevation />;
    case "spanish-colonial":
      return <SpanishColonialElevation />;
    case "texas-hill-country":
      return <TexasHillCountryElevation />;
    case "tudor-revival":
      return <TudorRevivalElevation />;
    default:
      return <span aria-hidden="true">?</span>;
  }
}
