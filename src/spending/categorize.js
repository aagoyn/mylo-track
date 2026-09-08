// Kategori disederhanakan dari versi awal (23 kategori jadi 12) biar keyboard koreksi
// kategori nggak kepanjangan. Semua keyword lama tetap dipakai, cuma dikelompokkan ulang.
const CATEGORY_RULES = {
  Food: [
    "gofood", "grabfood", "shopeefood", "ayam geprek", "ayam bakar", "ayam goreng",
    "ayam penyet", "nasi goreng", "nasi padang", "padang", "nasi uduk", "mie ayam",
    "mie goreng", "mie rebus", "sate", "bakso", "soto", "pecel", "warteg", "burger",
    "pizza", "hokben", "mcd", "mc donald", "kfc", "seafood", "ikan bakar", "makan",
    "makanan", "restaurant", "restoran", "sarapan", "breakfast", "lunch", "dinner",
    "roti", "kue", "bubur", "martabak", "martabak manis", "martabak terang bulan",
    "es krim", "ice cream", "gorengan", "keripik", "kerupuk", "ciki", "biskuit",
    "cookies", "pudding", "puding", "dessert", "cokelat", "chocolate", "kacang",
    "cemilan", "jajan", "snack",
  ],
  Coffee: [
    "starbucks", "janji jiwa", "kopi kenangan", "kopken", "fore coffee", "fore",
    "tomoro", "point coffee", "americano", "espresso", "cappuccino", "cappucino",
    "latte", "mocha", "macchiato", "kopi", "coffee", "cafe",
  ],
  Drink: [
    "chatime", "mixue", "pocari", "esteh", "es teh", "boba", "bubble tea", "matcha",
    "jus", "juice", "teh", "susu", "minum", "soft drink", "soda", "minuman",
  ],
  Groceries: [
    "beras", "rice", "telur", "telor", "daging", "daging sapi", "daging ayam",
    "fillet ayam", "ayam fillet", "fillet dada", "dada fillet", "fillet paha",
    "paha fillet", "daging kambing", "ayam mentah", "ayam segar", "ikan mentah",
    "ikan segar", "udang", "cumi", "kerang", "sayur", "sayuran", "buah",
    "buah-buahan", "kentang", "wortel", "tomat", "bawang", "bawang merah",
    "bawang putih", "cabai", "cabe", "brokoli", "kangkung", "bayam", "kol",
    "selada", "timun", "terong", "minyak goreng", "minyak", "gula", "gula pasir", "garam", "tepung",
    "tepung terigu", "tepung tapioka", "maizena", "bumbu", "bumbu dapur", "kecap",
    "saus", "sambal", "santan", "mentega", "margarin", "mie instan", "indomie",
    "pasta", "spaghetti", "sereal", "cereal", "oat", "oatmeal", "selai", "madu",
    "abon", "kaldu", "penyedap", "royco", "masako",
    "susu uht", "susu fresh", "susu segar", "yogurt", "yoghurt", "keju", "cheese",
    "cream cheese", "whipping cream",
    "teh celup", "teh kotak", "kopi bubuk", "kopi sachet", "sirup", "susu bubuk",
    "minuman serbuk", "energen", "good day", "torabika", "nescafe",
    "air mineral", "air minum", "air galon", "galon", "isi ulang galon",
    "refill galon", "aqua", "le minerale", "leminerale", "cleo", "club", "vit",
    "depot air", "air isi ulang",
    "tisu toilet", "toilet paper", "tisu dapur", "kitchen tissue", "tisu",
    "tissue", "kantong sampah", "plastik sampah", "plastic wrap", "cling wrap",
    "aluminium foil", "spons", "sponge", "sabut", "kain lap", "lap", "sapu",
    "pel", "ember", "baterai", "baterai rumah", "lilin", "korek",
    "sabun cuci piring", "sabun cuci", "cuci piring", "sunlight", "mama lemon",
    "pembersih lantai", "pembersih kaca", "pembersih toilet", "karbol",
    "disinfektan", "pemutih rumah", "cairan pembersih", "pengharum ruangan",
    "pewangi ruangan", "toilet cleaner", "floor cleaner", "sikat toilet",
    "laundry", "deterjen", "detergent", "sabun laundry", "softener",
    "pelembut pakaian", "pewangi pakaian", "pewangi laundry", "pemutih pakaian",
    "pelicin pakaian", "penghilang noda", "stain remover", "rinso", "attack",
    "molto", "downy", "sabun mandi", "body wash", "sampo", "shampoo", "conditioner", "odol",
    "pasta gigi", "sikat gigi", "deodorant", "deodoran", "facial wash",
    "face wash", "sabun muka", "cleanser", "cotton bud", "kapas",
    "tissue wajah", "tisu wajah", "razor", "pisau cukur", "shaving",
    "hand sanitizer", "handwash", "sabun tangan",
    "popok", "diapers", "pampers", "baby wipes", "tisu bayi", "susu formula",
    "formula bayi", "makanan bayi", "baby food", "bubur bayi", "sabun bayi",
    "shampoo bayi", "baby oil", "baby lotion", "minyak telon", "dot bayi",
    "botol bayi", "indomaret", "alfamart", "alfamidi", "superindo", "hypermart", "aeon",
    "lotte mart", "hari hari", "minimarket", "supermarket", "grocery",
    "groceries",
  ],
  Transport: [
    "grabcar", "grab bike", "grabbike", "grab motor", "gojek", "gocar", "goride",
    "maxim", "indrive", "ojol", "ojek", "bensin", "pertamax", "pertalite",
    "pertamax turbo", "shell", "parkir", "parking", "tol", "krl", "mrt", "lrt",
    "angkot", "bus", "bengkel", "servis motor", "servis mobil", "oli",
    "cuci motor", "cuci mobil", "tambal ban",
  ],
  Shopping: [
    "tokopedia", "shopee", "baju", "kaos", "kemeja", "celana", "jaket", "sepatu",
    "sandal", "tas", "jam tangan", "skincare", "makeup", "kosmetik", "elektronik",
    "headset", "earphone", "charger", "belanja", "shopping",
  ],
  Bills: [
    "pln", "listrik", "internet", "wifi", "pulsa", "kuota", "paket data",
    "netflix", "spotify", "kost", "pdam", "bpjs", "cicilan", "paylater",
    "kredit", "asuransi", "ipl", "pajak", "langganan",
  ],
  Health: [
    "obat", "apotek", "dokter", "dokter umum", "dokter gigi", "rs", "rumah sakit",
    "klinik", "puskesmas", "vitamin", "suplemen", "paracetamol", "mcu",
    "medical check up", "masker", "gigi", "behel", "pijat", "massage", "terapi",
  ],
  Entertainment: [
    "bioskop", "cinema", "game", "gaming", "steam", "playstation", "xbox",
    "nintendo", "topup game", "top up game", "nonton", "konser", "hobi", "buku",
    "novel", "mainan", "toy", "gym", "futsal", "badminton", "renang", "biliar",
    "billiard",
  ],
  Social: [
    "sedekah", "infaq", "infak", "donasi", "zakat", "kondangan", "sumbangan",
    "amplop", "kado", "hadiah", "gift", "nikahan", "pernikahan", "patungan",
  ],
  Pets: [
    "coffea", "kucing", "cat food", "petshop", "pet shop", "whiskas",
    "royal canin", "proplan", "anjing", "dog food", "pasir kucing", "cat litter",
    "vet", "dokter hewan", "grooming hewan", "pet grooming",
  ],
};

function keywordMatches(text, keyword) {
  keyword = keyword.toLowerCase().trim();
  if (!keyword.includes(" ")) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(^|\\s|[^a-z0-9])${escaped}($|\\s|[^a-z0-9])`, "i");
    return regex.test(text);
  }
  return text.includes(keyword);
}

// disortir sekali pas module di-load, bukan tiap detectCategory() dipanggil
const CATEGORY_ENTRIES = Object.entries(CATEGORY_RULES).map(([category, keywords]) => ({
  category,
  keywords: [...keywords].sort((a, b) => b.length - a.length),
}));

export function detectCategory(desc) {
  const text = desc.toLowerCase().trim().replace(/\s+/g, " ");

  if (text.includes("grabfood") || text.includes("gofood") || text.includes("shopeefood")) {
    return "Food";
  }
  if (
    text.includes("grabcar") ||
    text.includes("grabbike") ||
    text.includes("grab bike") ||
    text.includes("grab motor")
  ) {
    return "Transport";
  }
  if (text.includes("topup game") || text.includes("top up game")) return "Entertainment";

  const matches = [];
  for (const { category, keywords } of CATEGORY_ENTRIES) {
    for (const keyword of keywords) {
      if (keywordMatches(text, keyword)) {
        matches.push({ category, score: keyword.length });
      }
    }
  }

  if (matches.length === 0) return "Other";
  matches.sort((a, b) => b.score - a.score);
  return matches[0].category;
}
