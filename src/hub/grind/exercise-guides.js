// Exercise Form Guide ala Hevy: database panduan gerakan (target otot, RPE/tempo, cara eksekusi,
// hindari) + diagram SVG beranimasi (looping CSS, Start<->Peak) buat ke-28 gerakan di program
// 4-Day Hybrid Split (lihat gym-program.js). Diagram di-render SEKALI di server (bukan
// di-generate ulang di client) lalu diserialisasi sebagai JSON ke <script> halaman Gym - matching
// nama gerakan ke guide (case-insensitive keyword) tetap jalan di client karena nama gerakan di
// kartu bisa diketik bebas/di-generate dinamis tanpa round-trip ke server.
import { svgIcon } from "../../shared/dashboard-layout.js";

const ACCENT = "#C97368";

// Satu "pose" = titik-titik stick-figure tampak samping (1 lengan + 1 kaki cukup buat kesan
// gerakan, nggak perlu simetris penuh). Koordinat lokal 0-100 x 0-100.
function equipmentGlyph(type, p) {
  if (type === "dumbbell") {
    const [hx, hy] = p.hand;
    return `<circle cx="${hx - 6}" cy="${hy}" r="3"/><line x1="${hx - 6}" y1="${hy}" x2="${hx + 6}" y2="${hy}"/><circle cx="${hx + 6}" cy="${hy}" r="3"/>`;
  }
  if (type === "barbell") {
    const [hx, hy] = p.hand;
    return `<line x1="${hx - 15}" y1="${hy}" x2="${hx + 15}" y2="${hy}" stroke-width="3.5"/><circle cx="${hx - 15}" cy="${hy}" r="4"/><circle cx="${hx + 15}" cy="${hy}" r="4"/>`;
  }
  if (type === "cable") {
    const [hx, hy] = p.hand;
    const anchorY = hy > 50 ? hy + 30 : hy - 30;
    return `<line x1="${hx}" y1="${hy}" x2="${hx}" y2="${anchorY}" stroke-dasharray="2 4"/>`;
  }
  if (type === "bench") {
    return `<line x1="${p.hip[0] - 22}" y1="${p.hip[1] + 7}" x2="${p.hip[0] + 38}" y2="${p.hip[1] + 7}" stroke-width="3"/>`;
  }
  if (type === "bar") {
    const [hx, hy] = p.hand;
    return `<line x1="${hx - 18}" y1="${hy - 6}" x2="${hx + 18}" y2="${hy - 6}" stroke-width="3"/>`;
  }
  return "";
}

function limbGroup(p, highlightKey, equipment) {
  const hl = highlightKey ? p[highlightKey] : null;
  return `<line x1="${p.neck[0]}" y1="${p.neck[1]}" x2="${p.hip[0]}" y2="${p.hip[1]}"/>` +
    `<line x1="${p.neck[0]}" y1="${p.neck[1]}" x2="${p.elbow[0]}" y2="${p.elbow[1]}"/>` +
    `<line x1="${p.elbow[0]}" y1="${p.elbow[1]}" x2="${p.hand[0]}" y2="${p.hand[1]}"/>` +
    `<line x1="${p.hip[0]}" y1="${p.hip[1]}" x2="${p.knee[0]}" y2="${p.knee[1]}"/>` +
    `<line x1="${p.knee[0]}" y1="${p.knee[1]}" x2="${p.foot[0]}" y2="${p.foot[1]}"/>` +
    `<circle cx="${p.head[0]}" cy="${p.head[1]}" r="7"/>` +
    (equipment ? equipmentGlyph(equipment, p) : "") +
    (hl ? `<circle class="guide-highlight" cx="${hl[0]}" cy="${hl[1]}" r="4.5" fill="${ACCENT}" stroke="none"/>` : "");
}

// Figure beranimasi: 2 <g> (pose start & peak) ditumpuk persis di koordinat yang sama, lalu
// crossfade via CSS (lihat exerciseGuideStyles - @keyframes guide-pose-fade, 2.4s ease-in-out
// infinite alternate, pose peak di-offset setengah durasi pakai animation-delay negatif).
function animatedDiagramSvg(cfg) {
  const startInner = limbGroup(cfg.start, null, cfg.equipment);
  const peakInner = limbGroup(cfg.peak, cfg.highlight, cfg.equipment);
  return `<svg viewBox="0 0 240 150" width="100%" height="auto" role="img" aria-label="Animasi gerakan Start ke Peak" class="guide-anim-svg" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <g transform="translate(55,16) scale(1.3)">
      <g class="guide-pose guide-pose-start">${startInner}</g>
      <g class="guide-pose guide-pose-peak">${peakInner}</g>
    </g>
  </svg>`;
}

// Pose standing default (basis beberapa kategori, tangan/kaki-nya di-override per kategori).
const STANDING = { head: [50, 14], neck: [50, 21], hip: [50, 55], knee: [50, 78], foot: [50, 98] };

const POSES = {
  press: {
    equipment: "barbell",
    start: { head: [8, 60], neck: [20, 60], hip: [68, 60], knee: [78, 75], foot: [90, 65], elbow: [38, 80], hand: [38, 93] },
    peak: { head: [8, 60], neck: [20, 60], hip: [68, 60], knee: [78, 75], foot: [90, 65], elbow: [34, 38], hand: [32, 15] },
    highlight: "elbow",
  },
  fly: {
    equipment: "cable",
    start: { head: [15, 20], neck: [20, 26], hip: [20, 55], knee: [40, 50], foot: [55, 45], elbow: [6, 40], hand: [0, 48] },
    peak: { head: [15, 20], neck: [20, 26], hip: [20, 55], knee: [40, 50], foot: [55, 45], elbow: [36, 34], hand: [48, 30] },
    highlight: "neck",
  },
  rearDeltFly: {
    equipment: "cable",
    start: { head: [35, 24], neck: [40, 30], hip: [58, 52], knee: [63, 76], foot: [68, 98], elbow: [48, 40], hand: [55, 42] },
    peak: { head: [35, 24], neck: [40, 30], hip: [58, 52], knee: [63, 76], foot: [68, 98], elbow: [28, 34], hand: [14, 30] },
    highlight: "neck",
  },
  standingPress: {
    equipment: "dumbbell",
    start: { ...STANDING, elbow: [63, 35], hand: [67, 25] },
    peak: { ...STANDING, elbow: [57, 12], hand: [60, 1] },
    highlight: "neck",
  },
  lateralRaise: {
    equipment: "dumbbell",
    start: { ...STANDING, elbow: [54, 40], hand: [54, 50] },
    peak: { ...STANDING, elbow: [76, 24], hand: [93, 22] },
    highlight: "neck",
  },
  curl: {
    equipment: "dumbbell",
    start: { ...STANDING, elbow: [58, 44], hand: [58, 65] },
    peak: { ...STANDING, elbow: [58, 44], hand: [68, 27] },
    highlight: "elbow",
  },
  pushdown: {
    equipment: "cable",
    start: { ...STANDING, elbow: [58, 42], hand: [62, 29] },
    peak: { ...STANDING, elbow: [58, 42], hand: [62, 63] },
    highlight: "elbow",
  },
  pulldown: {
    equipment: "bar",
    start: { ...STANDING, elbow: [60, 11], hand: [64, 1] },
    peak: { ...STANDING, elbow: [62, 35], hand: [66, 46] },
    highlight: "neck",
  },
  row: {
    equipment: "cable",
    start: { head: [38, 20], neck: [42, 27], hip: [58, 52], knee: [63, 76], foot: [68, 98], elbow: [48, 44], hand: [50, 60] },
    peak: { head: [38, 20], neck: [42, 27], hip: [58, 52], knee: [63, 76], foot: [68, 98], elbow: [33, 38], hand: [22, 40] },
    highlight: "elbow",
  },
  squat: {
    equipment: "barbell",
    start: { ...STANDING, hip: [50, 50], knee: [50, 72], foot: [50, 97], elbow: [58, 36], hand: [60, 49] },
    peak: { head: [50, 32], neck: [50, 39], hip: [50, 66], knee: [63, 65], foot: [50, 97], elbow: [58, 54], hand: [60, 67] },
    highlight: "knee",
  },
  deadlift: {
    equipment: "barbell",
    start: { ...STANDING, hip: [50, 50], knee: [50, 72], foot: [50, 97], elbow: [50, 40], hand: [50, 62] },
    peak: { head: [27, 44], neck: [35, 46], hip: [52, 50], knee: [52, 70], foot: [50, 97], elbow: [35, 66], hand: [35, 86] },
    highlight: "hip",
  },
  plank: {
    equipment: null,
    start: { head: [10, 58], neck: [20, 58], hip: [56, 65], knee: [80, 76], foot: [93, 80], elbow: [20, 72], hand: [20, 80] },
    peak: { head: [10, 46], neck: [20, 46], hip: [56, 46], knee: [82, 47], foot: [96, 56], elbow: [20, 61], hand: [20, 71] },
    highlight: "hip",
  },
  legPress: {
    equipment: null,
    start: { head: [12, 22], neck: [20, 28], hip: [20, 55], knee: [46, 50], foot: [60, 44], elbow: [15, 42], hand: [12, 52] },
    peak: { head: [12, 22], neck: [20, 28], hip: [20, 55], knee: [70, 58], foot: [96, 60], elbow: [15, 42], hand: [12, 52] },
    highlight: "knee",
  },
  legCurl: {
    equipment: null,
    start: { head: [8, 55], neck: [18, 55], hip: [55, 55], knee: [80, 55], foot: [95, 53], elbow: [18, 66], hand: [18, 76] },
    peak: { head: [8, 55], neck: [18, 55], hip: [55, 55], knee: [78, 60], foot: [90, 78], elbow: [18, 66], hand: [18, 76] },
    highlight: "knee",
  },
  calfRaise: {
    equipment: null,
    start: { ...STANDING, elbow: [58, 36], hand: [60, 49], foot: [50, 98] },
    peak: { head: [50, 10], neck: [50, 17], hip: [50, 51], knee: [50, 74], foot: [50, 92], elbow: [58, 32], hand: [60, 45] },
    highlight: "foot",
  },
  tibialis: {
    equipment: null,
    start: { ...STANDING, elbow: [58, 36], hand: [60, 49], foot: [50, 98] },
    peak: { ...STANDING, knee: [48, 76], elbow: [58, 36], hand: [60, 49], foot: [42, 96] },
    highlight: "foot",
  },
  hipThrust: {
    equipment: "barbell",
    start: { head: [8, 60], neck: [18, 60], hip: [45, 75], knee: [70, 70], foot: [85, 78], elbow: [22, 68], hand: [26, 75] },
    peak: { head: [8, 60], neck: [18, 60], hip: [45, 55], knee: [70, 68], foot: [85, 78], elbow: [22, 68], hand: [26, 75] },
    highlight: "hip",
  },
  backExtension: {
    equipment: null,
    start: { head: [20, 80], neck: [30, 74], hip: [50, 60], knee: [75, 62], foot: [92, 60], elbow: [30, 84], hand: [35, 90] },
    peak: { head: [20, 45], neck: [30, 50], hip: [50, 60], knee: [75, 62], foot: [92, 60], elbow: [30, 58], hand: [35, 62] },
    highlight: "hip",
  },
  pullThrough: {
    equipment: "cable",
    start: { head: [22, 46], neck: [35, 42], hip: [52, 48], knee: [55, 70], foot: [50, 95], elbow: [45, 55], hand: [40, 52] },
    peak: { ...STANDING, hip: [50, 52], knee: [50, 74], foot: [50, 95], elbow: [55, 40], hand: [58, 48] },
    highlight: "hip",
  },
  pallof: {
    equipment: "cable",
    start: { ...STANDING, elbow: [58, 32], hand: [62, 28] },
    peak: { ...STANDING, elbow: [72, 28], hand: [88, 26] },
    highlight: "hip",
  },
  generic: {
    equipment: "dumbbell",
    start: { ...STANDING, elbow: [58, 42], hand: [58, 60] },
    peak: { ...STANDING, elbow: [58, 42], hand: [66, 32] },
    highlight: "elbow",
  },
};

function diagram(category) {
  return animatedDiagramSvg(POSES[category] || POSES.generic);
}

// Urutan dicek dari yang paling spesifik dulu biar nggak ketabrak (mis. "leg curl" harus kecek
// SEBELUM "curl" generik, "leg press" sebelum kemungkinan keyword lain yang mengandung "press").
export const EXERCISE_GUIDES = [
  {
    keywords: ["leg curl"],
    muscles: "Hamstrings",
    rpe: "RPE 8 · Tempo 2-1-2",
    steps: [
      "Berbaring/duduk di mesin, posisikan bantalan tepat di atas tumit/pergelangan kaki.",
      "Tekuk lutut menarik bantalan ke arah bokong sampai kontraksi penuh, tahan sejenak di puncak.",
      "Buang napas saat menekuk, tarik napas saat meluruskan kembali secara terkontrol.",
    ],
    avoid: "Jangan mengangkat pinggul dari bantalan/bench buat bantu gerakan.",
    diagram: diagram("legCurl"),
  },
  {
    keywords: ["leg press"],
    muscles: "Quads · Glutes · Hamstrings",
    rpe: "RPE 8 · Tempo 2-1-1",
    steps: [
      "Duduk di mesin, posisikan kaki selebar bahu di platform, punggung bawah tetap menempel di sandaran.",
      "Dorong platform sampai lutut hampir lurus (jangan sampai lurus penuh/lockout), tahan sejenak di titik puncak.",
      "Buang napas saat mendorong, tarik napas saat menurunkan beban secara terkontrol.",
    ],
    avoid: "Jangan biarkan lutut masuk ke dalam (knee cave) atau punggung bawah terangkat dari sandaran saat beban berat.",
    diagram: diagram("legPress"),
  },
  {
    keywords: ["calf raise"],
    muscles: "Calves (Gastrocnemius · Soleus)",
    rpe: "RPE 8 · Tempo 1-1-2",
    steps: [
      "Berdiri dengan ujung kaki di tepi platform/step, tumit menggantung bebas.",
      "Dorong tumit setinggi mungkin lewat ujung kaki, tahan 1 detik di puncak kontraksi.",
      "Turunkan tumit terkontrol sampai terasa stretch penuh di betis sebelum ulang.",
    ],
    avoid: "Jangan memantul (bouncing) - turunkan pelan supaya otot betis yang bekerja, bukan momentum.",
    diagram: diagram("calfRaise"),
  },
  {
    keywords: ["tibialis"],
    muscles: "Tibialis Anterior (otot depan tulang kering)",
    rpe: "RPE 7 · Tempo 2-1-2",
    steps: [
      "Berdiri tegak bersandar ke dinding/tumit menapak, beban kecil digantung di ujung kaki.",
      "Angkat ujung kaki (jari-jari) ke arah tulang kering sejauh mungkin, tahan sejenak.",
      "Turunkan terkontrol sampai ujung kaki hampir menyentuh lantai lagi.",
    ],
    avoid: "Jangan pakai beban berlebihan - gerakan ini kecil ROM-nya, prioritaskan kontrol penuh.",
    diagram: diagram("tibialis"),
  },
  {
    keywords: ["hip thrust"],
    muscles: "Glutes · Hamstrings",
    rpe: "RPE 7–8 · Tempo 2-1-1",
    steps: [
      "Sandarkan punggung atas di bench, kaki menapak selebar bahu, barbell/pad di atas pinggul.",
      "Dorong pinggul naik sampai badan lurus dari bahu ke lutut, remas glutes penuh di puncak.",
      "Buang napas saat mendorong naik, tarik napas saat menurunkan pinggul terkontrol.",
    ],
    avoid: "Jangan hiperekstensi punggung bawah di puncak - berhenti pas badan sudah lurus, jangan melengkung lebih.",
    diagram: diagram("hipThrust"),
  },
  {
    keywords: ["back extension"],
    muscles: "Lower Back · Glutes · Hamstrings",
    rpe: "RPE 7 · Tempo 2-1-2",
    steps: [
      "Posisikan pinggul di bantalan mesin, kaki terkunci aman, tangan menyilang di dada.",
      "Turunkan badan ke depan terkontrol sampai hampir 90°, lalu angkat kembali dengan menggerakkan pinggul (bukan menyentak punggung).",
      "Buang napas saat mengangkat badan, tarik napas saat turun.",
    ],
    avoid: "Jangan hiperekstensi berlebihan di puncak (melengkungkan punggung lebih dari garis lurus badan).",
    diagram: diagram("backExtension"),
  },
  {
    keywords: ["pull through"],
    muscles: "Glutes · Hamstrings",
    rpe: "RPE 7 · Tempo 2-1-1",
    steps: [
      "Berdiri membelakangi cable/tiang, tali ditarik dari sela kaki, badan hinge ke depan dari pinggul.",
      "Dorong pinggul maju sampai berdiri tegak penuh, remas glutes di puncak gerakan.",
      "Buang napas saat mendorong pinggul maju, tarik napas saat hinge kembali ke posisi awal.",
    ],
    avoid: "Jangan menekuk lutut berlebihan - gerakan ini fokus di pinggul (hip hinge), bukan squat.",
    diagram: diagram("pullThrough"),
  },
  {
    keywords: ["pallof"],
    muscles: "Core (Obliques · Anti-Rotation)",
    rpe: "RPE 6–7 · Tahan 2s tiap rep",
    steps: [
      "Berdiri menyamping ke arah cable/band, pegang handle di depan dada dengan kedua tangan.",
      "Dorong lurus ke depan menjauhi dada, tahan 1-2 detik sambil menahan badan supaya nggak terputar.",
      "Tarik kembali terkontrol ke dada, napas tetap teratur sepanjang gerakan.",
    ],
    avoid: "Jangan biarkan badan/pinggul ikut terputar mengikuti tarikan cable - itu kuncinya (anti-rotation).",
    diagram: diagram("pallof"),
  },
  {
    keywords: ["squat"],
    muscles: "Quads · Glutes · Hamstrings",
    rpe: "RPE 7–8 · Tempo 3-1-1",
    steps: [
      "Kaki selebar bahu, dada tegak, turunkan tubuh dengan menekuk lutut & pinggul bersamaan.",
      "Turun sampai paha minimal sejajar lantai, lutut mengikuti arah ujung kaki, lalu dorong tumit ke lantai untuk naik.",
      "Tarik napas saat turun, buang napas saat mendorong naik.",
    ],
    avoid: "Jangan biarkan lutut jatuh ke dalam atau tumit terangkat dari lantai.",
    diagram: diagram("squat"),
  },
  {
    keywords: ["deadlift"],
    muscles: "Hamstrings · Glutes · Lower Back",
    rpe: "RPE 6–7 · Tempo 1-1-2",
    note: "Hari Sabtu - jaga RPE di 6–7 (bukan all-out), biar recovery tetap aman buat Long Run hari Minggu.",
    steps: [
      "Berdiri dengan bar menempel dekat tulang kering, punggung lurus, dada membusung sedikit.",
      "Angkat dengan mendorong lantai lewat kaki & meluruskan pinggul, bar tetap menempel dekat tubuh sepanjang gerakan.",
      "Buang napas di puncak gerakan (berdiri tegak), tarik napas sebelum turun kembali.",
    ],
    avoid: "Jangan membulatkan punggung bawah (round back) atau menyentak bar dari lantai.",
    diagram: diagram("deadlift"),
  },
  {
    keywords: ["plank"],
    muscles: "Core · Shoulders",
    rpe: "RPE 6–7 · Hold statis",
    note: "Hari Sabtu - tahan sesuai target waktu aja, jangan dipaksa sampai gagal total biar badan tetap segar buat Long Run besoknya.",
    steps: [
      "Tumpu badan di lengan bawah & ujung kaki, siku tepat di bawah bahu.",
      "Luruskan tubuh dari kepala sampai tumit membentuk satu garis lurus, kencangkan perut & bokong.",
      "Napas tetap normal & teratur selama menahan posisi, jangan ditahan.",
    ],
    avoid: "Jangan biarkan pinggul turun (sagging) atau naik terlalu tinggi membentuk segitiga.",
    diagram: diagram("plank"),
  },
  {
    keywords: ["shoulder press", "overhead press", "military press", "ohp"],
    muscles: "Front Delts · Side Delts · Triceps",
    rpe: "RPE 8 · Tempo 2-1-1",
    steps: [
      "Pegang beban setinggi bahu, siku sedikit di depan tubuh, dada tetap tegak.",
      "Dorong beban lurus ke atas kepala sampai lengan hampir lurus, lalu turunkan terkontrol ke posisi awal.",
      "Buang napas saat mendorong ke atas, tarik napas saat menurunkan.",
    ],
    avoid: "Jangan melengkungkan punggung bawah berlebihan buat bantu dorongan.",
    diagram: diagram("standingPress"),
  },
  {
    keywords: ["lateral raise", "side raise"],
    muscles: "Side Delts · Traps",
    rpe: "RPE 8–9 · Tempo 2-1-2",
    steps: [
      "Berdiri tegak, beban di samping tubuh, siku sedikit ditekuk (soft elbow).",
      "Angkat lengan ke samping sampai sejajar bahu, tahan sejenak, lalu turunkan perlahan.",
      "Buang napas saat mengangkat, tarik napas saat menurunkan - gerakan tetap terkontrol, bukan ayunan.",
    ],
    avoid: "Jangan pakai momentum/ayunan badan atau mengangkat lengan di atas garis bahu.",
    diagram: diagram("lateralRaise"),
  },
  {
    keywords: ["fly"],
    muscles: "Chest (Pectoralis)",
    rpe: "RPE 8–9 · Tempo 3-1-1",
    steps: [
      "Duduk di mesin pec deck, punggung menempel sandaran, lengan memegang pegangan dengan siku sedikit ditekuk.",
      "Rapatkan kedua lengan di depan dada mengikuti busur, remas otot dada di puncak kontraksi.",
      "Buang napas saat merapatkan, tarik napas saat membuka lengan kembali terkontrol.",
    ],
    avoid: "Jangan membuka lengan terlalu jauh ke belakang sampai bahu terasa nyeri/tertarik.",
    diagram: diagram("fly"),
  },
  {
    keywords: ["reverse pec deck", "rear delt"],
    muscles: "Rear Delts · Upper Back",
    rpe: "RPE 8 · Tempo 2-1-2",
    steps: [
      "Duduk menghadap mesin (dada menempel pad), pegang handle dengan lengan sedikit ditekuk.",
      "Buka lengan ke samping/belakang mengikuti busur, remas tulang belikat di puncak gerakan.",
      "Buang napas saat membuka lengan, tarik napas saat kembali ke posisi depan terkontrol.",
    ],
    avoid: "Jangan pakai momentum menyentak atau mengangkat bahu ke arah telinga saat menarik.",
    diagram: diagram("rearDeltFly"),
  },
  {
    keywords: ["curl"],
    muscles: "Biceps · Forearms",
    rpe: "RPE 8–9 · Tempo 2-1-2",
    steps: [
      "Berdiri tegak, siku menempel di samping tubuh, beban mulai dari lengan lurus di bawah.",
      "Tekuk siku mengangkat beban ke arah bahu, siku tetap diam di tempat (nggak maju-mundur).",
      "Buang napas saat mengangkat, tarik napas saat menurunkan terkontrol.",
    ],
    avoid: "Jangan ayunkan siku ke depan/belakang atau pakai momentum punggung buat bantu angkat.",
    diagram: diagram("curl"),
  },
  {
    keywords: ["pushdown", "tricep extension", "skull crusher", "tricep"],
    muscles: "Triceps",
    rpe: "RPE 8–9 · Tempo 2-1-2",
    steps: [
      "Siku menempel di samping tubuh, badan sedikit condong ke depan, pegangan selebar bahu.",
      "Luruskan lengan ke bawah sampai hampir lurus penuh, siku tetap diam di tempat.",
      "Buang napas saat mendorong ke bawah, tarik napas saat kembali ke posisi awal.",
    ],
    avoid: "Jangan biarkan siku bergerak maju-mundur menjauh dari badan.",
    diagram: diagram("pushdown"),
  },
  {
    keywords: ["pulldown", "pull-up", "pullup", "chin-up", "chinup"],
    muscles: "Lats · Biceps · Rear Delts",
    rpe: "RPE 7–8 · Tempo 2-1-2",
    steps: [
      "Pegang bar lebih lebar dari bahu, dada sedikit membusung, badan tetap stabil.",
      "Tarik bar ke arah dada atas dengan menggerakkan siku ke bawah & belakang, fokus kontraksi di punggung.",
      "Buang napas saat menarik ke bawah, tarik napas saat kembali ke posisi atas terkontrol.",
    ],
    avoid: "Jangan menarik pakai ayunan badan (momentum) atau menarik bar ke belakang leher.",
    diagram: diagram("pulldown"),
  },
  {
    keywords: ["row"],
    muscles: "Lats · Rhomboids · Rear Delts · Biceps",
    rpe: "RPE 7–8 · Tempo 2-1-2",
    steps: [
      "Condongkan badan ke depan dari pinggul, punggung lurus, beban mulai dengan lengan terjulur.",
      "Tarik beban ke arah perut/pinggang dengan menggerakkan siku ke belakang, remas tulang belikat di puncak.",
      "Buang napas saat menarik, tarik napas saat meluruskan lengan kembali.",
    ],
    avoid: "Jangan membulatkan punggung atau menyentak beban pakai ayunan badan.",
    diagram: diagram("row"),
  },
  {
    keywords: ["bench", "incline", "decline", "chest press", "dip"],
    muscles: "Chest · Front Delts · Triceps",
    rpe: "RPE 7–8 · Tempo 2-1-1",
    steps: [
      "Berbaring di bench, mata sejajar bar, genggam sedikit lebih lebar dari bahu, kaki menapak kuat di lantai.",
      "Turunkan beban terkontrol ke dada/sedikit di bawah dada, lalu dorong lurus ke atas sampai lengan hampir lurus.",
      "Tarik napas saat menurunkan, buang napas saat mendorong ke atas.",
    ],
    avoid: "Jangan memantulkan beban di dada (bouncing) atau mengangkat bokong dari bench.",
    diagram: diagram("press"),
  },
];

export const GENERIC_GUIDE = {
  muscles: "Sesuaikan dengan otot target gerakan ini",
  rpe: "RPE 7–8 · Tempo 2-1-2",
  steps: [
    "Posisikan tubuh stabil & atur pegangan/postur sebelum mulai mengangkat.",
    "Gerakkan beban secara terkontrol dari posisi awal ke titik kontraksi penuh, hindari momentum/ayunan.",
    "Atur napas: buang napas saat fase usaha (mengangkat/mendorong), tarik napas saat fase turun.",
  ],
  avoid: "Jangan menambah beban melebihi kemampuan kontrol gerakan - form yang benar lebih penting dari beban berat.",
  diagram: diagram("generic"),
};

// Quick Swap Exercise - alat/variasi setara yang bisa saling gantiin kalau gym lagi penuh, key
// pakai nama gerakan lowercase (cocok sama exerciseName persis yang ada di gym-program.js).
// Nggak lengkap buat semua 28 gerakan (yang nggak ada map-nya cukup pakai opsi custom di popover).
export const EXERCISE_ALTERNATIVES = {
  "barbell bench press": ["Dumbbell Bench Press", "Machine Chest Press"],
  "dumbbell bench press": ["Barbell Bench Press", "Machine Chest Press"],
  "incline dumbbell press": ["Incline Barbell Press", "Incline Smith Press"],
  "cable lateral raise": ["Dumbbell Lateral Raise", "Machine Lateral Raise"],
  "pull-up / assisted pull-up": ["Lat Pulldown"],
  "lat pulldown": ["Pull-up / Assisted Pull-up"],
  "chest supported row": ["Seated Cable Row", "Single-Arm Dumbbell Row"],
  "seated cable row": ["Chest Supported Row", "Single-Arm Dumbbell Row"],
  "barbell back squat": ["Hack Squat", "Goblet Squat"],
  "leg press": ["Bulgarian Split Squat"],
  "bulgarian split squat": ["Leg Press"],
  "conventional deadlift": ["Trap Bar Deadlift", "Romanian Deadlift"],
};

// window.getExerciseAlternatives(name) dipanggil dari popover Swap tiap kartu gerakan (lihat
// gym-page.js) - data lookup doang, UI popover-nya sendiri di-render di sana (punya akses
// langsung ke card/nameInput).
export function exerciseAlternativesScript() {
  return `<script>
    (function () {
      var ALTS = ${JSON.stringify(EXERCISE_ALTERNATIVES)};
      window.getExerciseAlternatives = function (name) {
        return ALTS[(name || "").toLowerCase().trim()] || [];
      };
    })();
  </script>`;
}

// Serialisasi guide (SVG diagram sudah jadi string) ke <script> halaman + logic matching & buka
// dialog di client. window.openExerciseGuide(name) dipanggil dari tombol "?" tiap kartu gerakan.
export function exerciseGuideScript() {
  const data = {
    guides: EXERCISE_GUIDES.map((g) => ({
      keywords: g.keywords, muscles: g.muscles, rpe: g.rpe, steps: g.steps, avoid: g.avoid, note: g.note || null, diagram: g.diagram,
    })),
    generic: GENERIC_GUIDE,
  };
  return `<script>
    (function () {
      var DATA = ${JSON.stringify(data)};
      var dialog = document.getElementById("exercise-guide-dialog");
      if (!dialog) return;
      var nameEl = document.getElementById("guide-name");
      var musclesEl = document.getElementById("guide-muscles");
      var rpeEl = document.getElementById("guide-rpe");
      var diagramEl = document.getElementById("guide-diagram");
      var stepsEl = document.getElementById("guide-steps");
      var avoidEl = document.getElementById("guide-avoid");
      var noteBox = document.getElementById("guide-note-box");
      var noteEl = document.getElementById("guide-note");
      var closeBtn = document.getElementById("guide-close");
      var diagramWrap = document.getElementById("guide-diagram-wrap");
      var toggleBtn = document.getElementById("guide-anim-toggle");

      function matchGuide(name) {
        var n = (name || "").toLowerCase();
        for (var i = 0; i < DATA.guides.length; i++) {
          var g = DATA.guides[i];
          for (var j = 0; j < g.keywords.length; j++) {
            if (n.indexOf(g.keywords[j]) !== -1) return g;
          }
        }
        return DATA.generic;
      }

      window.openExerciseGuide = function (name) {
        var g = matchGuide(name);
        nameEl.textContent = name && name.trim() ? name : "Gerakan";
        musclesEl.textContent = g.muscles;
        rpeEl.textContent = g.rpe || "";
        rpeEl.hidden = !g.rpe;
        diagramEl.innerHTML = g.diagram;
        stepsEl.innerHTML = g.steps.map(function (s) { return "<li>" + s + "</li>"; }).join("");
        avoidEl.textContent = g.avoid;
        if (g.note) {
          noteEl.textContent = g.note;
          noteBox.hidden = false;
        } else {
          noteBox.hidden = true;
        }
        if (diagramWrap) diagramWrap.classList.remove("guide-paused");
        if (toggleBtn) toggleBtn.innerHTML = ${JSON.stringify(svgIcon("pause", { size: 13 }))};
        dialog.showModal();
      };

      if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
          var paused = diagramWrap.classList.toggle("guide-paused");
          toggleBtn.innerHTML = paused
            ? ${JSON.stringify(svgIcon("play", { size: 13 }))}
            : ${JSON.stringify(svgIcon("pause", { size: 13 }))};
        });
      }

      if (closeBtn) closeBtn.addEventListener("click", function () { dialog.close(); });
      dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
    })();
  </script>`;
}

// Skeleton dialog - konten diisi dinamis oleh exerciseGuideScript() tiap kali tombol "?" diklik,
// biar bisa cocokin ke nama gerakan yang diketik user secara real-time (nggak perlu render ulang
// dari server karena kartu gerakan sepenuhnya di-manage client-side, lihat gym-page.js).
export function exerciseGuideDialogHtml() {
  return `<dialog class="modal-dialog glass-card guide-dialog" id="exercise-guide-dialog">
    <div class="modal-dialog-body">
      <div class="modal-dialog-header">
        <div>
          <h3 id="guide-name">Gerakan</h3>
          <div class="guide-muscle-badge" id="guide-muscles"></div>
          <div class="guide-rpe-badge" id="guide-rpe"></div>
        </div>
        <button type="button" class="modal-close-btn" id="guide-close" aria-label="Tutup">✕</button>
      </div>
      <div class="guide-diagram-wrap" id="guide-diagram-wrap">
        <div id="guide-diagram"></div>
        <button type="button" class="guide-anim-toggle" id="guide-anim-toggle" aria-label="Pause/Play animasi"></button>
      </div>
      <div class="guide-section-label">Cara Eksekusi</div>
      <ul class="guide-steps" id="guide-steps"></ul>
      <div class="guide-avoid-box"><strong>Hindari:</strong> <span id="guide-avoid"></span></div>
      <div class="guide-note-box" id="guide-note-box" hidden><strong>Catatan Recovery:</strong> <span id="guide-note"></span></div>
    </div>
  </dialog>`;
}

// CSS fitur guide - diexport terpisah (bukan numpang di GYM_PAGE_CSS gym-page.js) biar modul ini
// mandiri/portable kalau suatu saat guide dipakai di halaman lain juga.
export function exerciseGuideStyles() {
  return `
  .guide-muscle-badge { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
  .guide-rpe-badge { font-size: 11.5px; color: var(--accent); font-weight: 600; margin-top: 2px; }
  .guide-diagram-wrap {
    position: relative; color: var(--text-muted); margin: 14px 0; background: var(--surface-hover);
    border-radius: 12px; padding: 6px;
  }
  .guide-diagram-wrap svg { display: block; }
  .guide-anim-toggle {
    position: absolute; top: 10px; right: 10px; width: 26px; height: 26px; border-radius: 50%;
    border: none; background: var(--bg); color: var(--text); cursor: pointer; display: flex;
    align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,.15);
  }
  .guide-anim-toggle:hover { background: var(--surface-hover); }
  .guide-anim-toggle .svg-icon { margin: 0; }

  .guide-pose { animation: guide-pose-fade 2.4s ease-in-out infinite alternate; }
  .guide-pose-peak { animation-delay: -1.2s; }
  .guide-pose .guide-highlight { animation: guide-pulse 2.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
  .guide-paused .guide-pose, .guide-paused .guide-highlight { animation-play-state: paused; }
  @keyframes guide-pose-fade { from { opacity: 1; } to { opacity: 0; } }
  @keyframes guide-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }

  .guide-section-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .03em; color: var(--text-dim); margin-bottom: 6px; }
  .guide-steps { margin: 0 0 12px; padding-left: 18px; display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--text); }
  .guide-avoid-box {
    font-size: 12.5px; line-height: 1.5; color: var(--text-muted); background: var(--surface-hover);
    border-radius: 10px; padding: 10px 12px;
  }
  .guide-avoid-box strong { color: var(--danger); }
  .guide-note-box {
    font-size: 12.5px; line-height: 1.5; color: var(--text-muted); background: var(--accent-light);
    border-radius: 10px; padding: 10px 12px; margin-top: 8px;
  }
  .guide-note-box strong { color: var(--accent-deep); }
  `;
}
