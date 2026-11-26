// Exercise Form Guide: database panduan gerakan (target otot, cara eksekusi, hindari) + diagram
// SVG 2-fase (START -> PEAK) minimalis ala stick-figure. Diagram di-render SEKALI di server
// (bukan di-generate ulang di client) lalu diserialisasi sebagai JSON ke <script> halaman Gym -
// matching nama gerakan ke guide (case-insensitive keyword) tetap jalan di client karena nama
// gerakan di kartu bisa diketik bebas/di-generate dinamis tanpa round-trip ke server.
const ACCENT = "#C97368";

// Satu "pose" = titik-titik stick-figure tampak samping (1 lengan + 1 kaki cukup buat kesan
// gerakan, nggak perlu simetris penuh). Koordinat lokal 0-100 x 0-100, nanti di-translate ke
// slot START (kiri) & PEAK (kanan) di viewBox 280x120.
function limbGroup(p, highlightKey) {
  const hl = highlightKey ? p[highlightKey] : null;
  return `<circle cx="${p.head[0]}" cy="${p.head[1]}" r="7"/>` +
    `<line x1="${p.neck[0]}" y1="${p.neck[1]}" x2="${p.hip[0]}" y2="${p.hip[1]}"/>` +
    `<line x1="${p.neck[0]}" y1="${p.neck[1]}" x2="${p.elbow[0]}" y2="${p.elbow[1]}"/>` +
    `<line x1="${p.elbow[0]}" y1="${p.elbow[1]}" x2="${p.hand[0]}" y2="${p.hand[1]}"/>` +
    `<line x1="${p.hip[0]}" y1="${p.hip[1]}" x2="${p.knee[0]}" y2="${p.knee[1]}"/>` +
    `<line x1="${p.knee[0]}" y1="${p.knee[1]}" x2="${p.foot[0]}" y2="${p.foot[1]}"/>` +
    (hl ? `<circle cx="${hl[0]}" cy="${hl[1]}" r="4.5" fill="${ACCENT}" stroke="none"/>` : "");
}

function twoStepDiagramSvg({ start, peak, highlight }) {
  return `<svg viewBox="0 0 280 120" width="100%" height="auto" role="img" aria-label="Diagram posisi START dan PEAK" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <g transform="translate(14,8)">${limbGroup(start, highlight)}</g>
    <g transform="translate(164,8)">${limbGroup(peak, highlight)}</g>
    <line x1="122" y1="55" x2="150" y2="55"/>
    <path d="M150,49 L161,55 L150,61 Z" fill="currentColor" stroke="none"/>
    <text x="59" y="113" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1" fill="currentColor" stroke="none">START</text>
    <text x="209" y="113" text-anchor="middle" font-size="10" font-weight="700" letter-spacing="1" fill="currentColor" stroke="none">PEAK</text>
  </svg>`;
}

// Pose standing default (dipakai sebagai basis buat beberapa kategori, tangan/kaki-nya di-override).
const STANDING = { head: [50, 14], neck: [50, 21], hip: [50, 55], knee: [50, 78], foot: [50, 98] };

const POSES = {
  press: {
    // Bench/incline/chest press/dip - rebahan, lengan dorong ke atas.
    start: { head: [8, 60], neck: [20, 60], hip: [68, 60], knee: [78, 75], foot: [90, 65], elbow: [38, 80], hand: [38, 93] },
    peak: { head: [8, 60], neck: [20, 60], hip: [68, 60], knee: [78, 75], foot: [90, 65], elbow: [34, 38], hand: [32, 15] },
    highlight: "elbow",
  },
  standingPress: {
    // Shoulder/overhead press - berdiri, lengan dorong ke atas kepala.
    start: { ...STANDING, elbow: [63, 35], hand: [67, 25] },
    peak: { ...STANDING, elbow: [57, 12], hand: [60, 1] },
    highlight: "neck",
  },
  lateralRaise: {
    start: { ...STANDING, elbow: [54, 40], hand: [54, 50] },
    peak: { ...STANDING, elbow: [76, 24], hand: [93, 22] },
    highlight: "neck",
  },
  curl: {
    start: { ...STANDING, elbow: [58, 44], hand: [58, 65] },
    peak: { ...STANDING, elbow: [58, 44], hand: [68, 27] },
    highlight: "elbow",
  },
  pushdown: {
    start: { ...STANDING, elbow: [58, 42], hand: [62, 29] },
    peak: { ...STANDING, elbow: [58, 42], hand: [62, 63] },
    highlight: "elbow",
  },
  pulldown: {
    start: { ...STANDING, elbow: [60, 11], hand: [64, 1] },
    peak: { ...STANDING, elbow: [62, 35], hand: [66, 46] },
    highlight: "neck",
  },
  row: {
    // Sedikit bungkuk ke depan.
    start: { head: [38, 20], neck: [42, 27], hip: [58, 52], knee: [63, 76], foot: [68, 98], elbow: [48, 44], hand: [50, 60] },
    peak: { head: [38, 20], neck: [42, 27], hip: [58, 52], knee: [63, 76], foot: [68, 98], elbow: [33, 38], hand: [22, 40] },
    highlight: "elbow",
  },
  squat: {
    start: { ...STANDING, hip: [50, 50], knee: [50, 72], foot: [50, 97], elbow: [58, 36], hand: [60, 49] },
    peak: { head: [50, 32], neck: [50, 39], hip: [50, 66], knee: [63, 65], foot: [50, 97], elbow: [58, 54], hand: [60, 67] },
    highlight: "knee",
  },
  deadlift: {
    start: { ...STANDING, hip: [50, 50], knee: [50, 72], foot: [50, 97], elbow: [50, 40], hand: [50, 62] },
    peak: { head: [27, 44], neck: [35, 46], hip: [52, 50], knee: [52, 70], foot: [50, 97], elbow: [35, 66], hand: [35, 86] },
    highlight: "hip",
  },
  plank: {
    start: { head: [10, 58], neck: [20, 58], hip: [56, 65], knee: [80, 76], foot: [93, 80], elbow: [20, 72], hand: [20, 80] },
    peak: { head: [10, 46], neck: [20, 46], hip: [56, 46], knee: [82, 47], foot: [96, 56], elbow: [20, 61], hand: [20, 71] },
    highlight: "hip",
  },
  legPress: {
    // Duduk/rebahan, kaki yang kerja (knee->foot) ditekuk lalu diluruskan.
    start: { head: [12, 22], neck: [20, 28], hip: [20, 55], knee: [46, 50], foot: [60, 44], elbow: [15, 42], hand: [12, 52] },
    peak: { head: [12, 22], neck: [20, 28], hip: [20, 55], knee: [70, 58], foot: [96, 60], elbow: [15, 42], hand: [12, 52] },
    highlight: "knee",
  },
  generic: {
    start: { ...STANDING, elbow: [58, 42], hand: [58, 60] },
    peak: { ...STANDING, elbow: [58, 42], hand: [66, 32] },
    highlight: "elbow",
  },
};

function diagram(category) {
  return twoStepDiagramSvg(POSES[category] || POSES.generic);
}

// Urutan dicek dari yang paling spesifik dulu biar nggak ketabrak (mis. "leg press" harus kecek
// sebelum kemungkinan keyword umum lain yang mengandung kata "press").
export const EXERCISE_GUIDES = [
  {
    keywords: ["leg press"],
    muscles: "Quads · Glutes · Hamstrings",
    steps: [
      "Duduk di mesin, posisikan kaki selebar bahu di platform, punggung bawah tetap menempel di sandaran.",
      "Dorong platform sampai lutut hampir lurus (jangan sampai lurus penuh/lockout), tahan sejenak di titik puncak.",
      "Buang napas saat mendorong, tarik napas saat menurunkan beban secara terkontrol.",
    ],
    avoid: "Jangan biarkan lutut masuk ke dalam (knee cave) atau punggung bawah terangkat dari sandaran saat beban berat.",
    diagram: diagram("legPress"),
  },
  {
    keywords: ["squat"],
    muscles: "Quads · Glutes · Hamstrings",
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
    steps: [
      "Berdiri tegak, beban di samping tubuh, siku sedikit ditekuk (soft elbow).",
      "Angkat lengan ke samping sampai sejajar bahu, tahan sejenak, lalu turunkan perlahan.",
      "Buang napas saat mengangkat, tarik napas saat menurunkan - gerakan tetap terkontrol, bukan ayunan.",
    ],
    avoid: "Jangan pakai momentum/ayunan badan atau mengangkat lengan di atas garis bahu.",
    diagram: diagram("lateralRaise"),
  },
  {
    keywords: ["curl"],
    muscles: "Biceps · Forearms",
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
  steps: [
    "Posisikan tubuh stabil & atur pegangan/postur sebelum mulai mengangkat.",
    "Gerakkan beban secara terkontrol dari posisi awal ke titik kontraksi penuh, hindari momentum/ayunan.",
    "Atur napas: buang napas saat fase usaha (mengangkat/mendorong), tarik napas saat fase turun.",
  ],
  avoid: "Jangan menambah beban melebihi kemampuan kontrol gerakan - form yang benar lebih penting dari beban berat.",
  diagram: diagram("generic"),
};

// Serialisasi guide (sudah termasuk SVG diagram jadi string) ke <script> halaman + logic matching
// & buka dialog di client. window.openExerciseGuide(name) dipanggil dari tombol "?" tiap kartu.
export function exerciseGuideScript() {
  const data = {
    guides: EXERCISE_GUIDES.map((g) => ({ keywords: g.keywords, muscles: g.muscles, steps: g.steps, avoid: g.avoid, diagram: g.diagram })),
    generic: GENERIC_GUIDE,
  };
  return `<script>
    (function () {
      var DATA = ${JSON.stringify(data)};
      var dialog = document.getElementById("exercise-guide-dialog");
      if (!dialog) return;
      var nameEl = document.getElementById("guide-name");
      var musclesEl = document.getElementById("guide-muscles");
      var diagramEl = document.getElementById("guide-diagram");
      var stepsEl = document.getElementById("guide-steps");
      var avoidEl = document.getElementById("guide-avoid");
      var closeBtn = document.getElementById("guide-close");

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
        diagramEl.innerHTML = g.diagram;
        stepsEl.innerHTML = g.steps.map(function (s) { return "<li>" + s + "</li>"; }).join("");
        avoidEl.textContent = g.avoid;
        dialog.showModal();
      };

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
        </div>
        <button type="button" class="modal-close-btn" id="guide-close" aria-label="Tutup">✕</button>
      </div>
      <div class="guide-diagram-wrap" id="guide-diagram"></div>
      <div class="guide-section-label">Cara Eksekusi</div>
      <ul class="guide-steps" id="guide-steps"></ul>
      <div class="guide-avoid-box"><strong>Hindari:</strong> <span id="guide-avoid"></span></div>
    </div>
  </dialog>`;
}
