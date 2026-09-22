// Decorative elevation based on the existing Modern exterior-style illustration.
export type Point = [number, number];
type Stroke = { points: Point[]; weight: number };
type Wash = { after: number; d: string; fill: string };
export type Elevation = { strokes: Stroke[]; washes: Wash[]; drawMs: number; sceneScale: number };

const line = (weight: number, ...points: Point[]): Stroke => ({ points, weight });

// Trace the existing Modern exterior-style image in its original proportions.
// Source: public/images/plan-your-home/exterior-styles/modern.webp (768 x 512).
// Reference-image coordinates keep the facade recognizable; the arm still draws
// every stroke. This is illustrative study artwork, not a completed-project claim.
const housePoint = ([x, y]: Point): Point => [112 + x * 0.31, 174 + y * 0.31];
const houseLine = (weight: number, ...points: Point[]): Stroke =>
  line(weight, ...points.map(housePoint));
const houseWash = (after: number, fill: string, ...points: Point[]): Wash => ({
  after,
  fill,
  d: points.map(housePoint).map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ") + "Z",
});

export const draftingElevation: Elevation = {
  sceneScale: 1.35,
  // Keep the detailed facade at a calm drafting pace.
  drawMs: 19000,
  strokes: [
    // Ground, side wings, and stepped masonry tower.
    houseLine(1.5, [36, 423], [716, 423]), // 0
    houseLine(0.85, [649, 240], [710, 240], [710, 410], [618, 410], [618, 294], [649, 285], [649, 240]), // 1
    houseLine(1.05, [164, 242], [164, 128], [291, 128], [291, 150], [265, 150], [265, 183], [217, 183], [217, 405], [208, 405], [208, 242], [164, 242]), // 2
    houseLine(1.1, [59, 242], [204, 242], [204, 410], [59, 410], [59, 242]), // 3
    // Central plaster face and its crisp parapet.
    houseLine(1.05, [265, 150], [426, 150], [421, 170], [421, 405], [377, 405], [377, 288], [394, 288], [394, 266], [265, 266], [265, 150]), // 4
    houseLine(0.45, [265, 154], [423, 154]), // 5
    // Projecting charcoal frame: head, right return, and balcony slab.
    houseLine(1.3, [426, 148], [649, 148], [649, 285], [414, 285], [414, 266], [617, 266], [617, 170], [422, 170], [426, 148]), // 6
    houseLine(0.85, [435, 181], [575, 181], [575, 266], [435, 266], [435, 181]), // 7
    houseLine(0.6, [482, 181], [482, 266]), // 8
    houseLine(0.6, [529, 181], [529, 266]), // 9
    houseLine(0.6, [577, 181], [613, 181], [613, 266], [577, 266], [577, 181]), // 10
    // Tall stair glazing tucks behind the entry canopy.
    houseLine(0.85, [218, 185], [265, 185], [265, 266], [256, 266], [256, 402], [218, 402], [218, 185]), // 11
    houseLine(0.5, [251, 185], [251, 402]), // 12
    houseLine(0.5, [218, 265], [256, 265]), // 13
    houseLine(1.05, [256, 267], [394, 267], [394, 286], [256, 286], [256, 267]), // 14
    // Recessed timber entry, door, and narrow glazed insert.
    houseLine(0.7, [263, 289], [377, 289], [377, 405], [263, 405], [263, 289]), // 15
    houseLine(0.95, [309, 307], [369, 307], [369, 403], [309, 403], [309, 307]), // 16
    houseLine(0.5, [328, 325], [351, 325], [351, 391], [328, 391], [328, 325]), // 17
    // Ground-floor glass completes the two-storey volume.
    houseLine(0.95, [423, 298], [597, 298], [597, 402], [423, 402], [423, 298]), // 18
    houseLine(0.6, [462, 298], [462, 402]), // 19
    houseLine(0.6, [504, 298], [504, 402]), // 20
    houseLine(0.6, [548, 298], [548, 402]), // 21
    houseLine(0.5, [581, 298], [581, 402]), // 22
    // Balcony handrail and four slender posts, drawn in front of the glass.
    houseLine(0.75, [419, 266], [419, 239], [616, 239], [616, 266]), // 23
    houseLine(0.45, [452, 239], [452, 266]), // 24
    houseLine(0.45, [493, 239], [493, 266]), // 25
    houseLine(0.45, [534, 239], [534, 266]), // 26
    houseLine(0.45, [575, 239], [575, 266]), // 27
    // The small side light and clerestory preserve the reference's asymmetry.
    houseLine(0.7, [90, 291], [114, 291], [114, 402], [90, 402], [90, 291]), // 28
    houseLine(0.45, [90, 319], [114, 319]), // 29
    houseLine(0.7, [297, 187], [401, 187], [401, 208], [297, 208], [297, 187]), // 30
    houseLine(0.45, [331, 187], [331, 208]), // 31
    houseLine(0.45, [380, 187], [380, 208]), // 32
    // Shallow steps and a few material joints, kept deliberately sparse.
    houseLine(0.65, [288, 423], [288, 406], [385, 406], [385, 423]), // 33
    houseLine(0.45, [288, 414], [385, 414]), // 34
    houseLine(0.45, [164, 133], [291, 133]), // 35
    houseLine(0.35, [263, 315], [289, 315], [289, 337], [263, 337], [263, 359], [289, 359], [289, 381], [263, 381]), // 36
    houseLine(0.35, [577, 210], [613, 210], [613, 237], [577, 237]), // 37
    houseLine(0.35, [649, 329], [708, 329]), // 38
    houseLine(0.35, [649, 365], [708, 365]), // 39
  ],
  washes: [
    houseWash(1, "rgba(93,86,75,0.055)", [649, 240], [710, 240], [710, 410], [618, 410], [618, 294], [649, 285]),
    houseWash(2, "rgba(93,86,75,0.055)", [164, 242], [164, 128], [291, 128], [291, 150], [265, 150], [265, 183], [217, 183], [217, 405], [208, 405], [208, 242]),
    houseWash(6, "rgba(35,45,63,0.085)", [426, 148], [649, 148], [649, 285], [414, 285], [414, 266], [617, 266], [617, 170], [422, 170]),
    houseWash(7, "rgba(0,91,65,0.055)", [435, 181], [575, 181], [575, 266], [435, 266]),
    houseWash(10, "rgba(93,86,75,0.07)", [577, 181], [613, 181], [613, 266], [577, 266]),
    houseWash(11, "rgba(0,91,65,0.055)", [218, 185], [265, 185], [265, 266], [256, 266], [256, 402], [218, 402]),
    houseWash(14, "rgba(35,45,63,0.08)", [256, 267], [394, 267], [394, 286], [256, 286]),
    houseWash(15, "rgba(93,86,75,0.07)", [263, 289], [377, 289], [377, 405], [263, 405]),
    houseWash(16, "rgba(35,45,63,0.085)", [309, 307], [369, 307], [369, 403], [309, 403]),
    houseWash(17, "rgba(0,91,65,0.055)", [328, 325], [351, 325], [351, 391], [328, 391]),
    houseWash(18, "rgba(0,91,65,0.055)", [423, 298], [597, 298], [597, 402], [423, 402]),
    houseWash(28, "rgba(0,91,65,0.055)", [90, 291], [114, 291], [114, 402], [90, 402]),
    houseWash(30, "rgba(0,91,65,0.055)", [297, 187], [401, 187], [401, 208], [297, 208]),
  ],
};
