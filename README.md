# Mylo Track

Node/Express + Supabase app yang gabungin dua Telegram bot (Spending & Calorie tracker) plus
satu **Personal Hub** web dashboard: home overview, Mood Tracker (kalender ala GitHub
contribution graph), Journal harian, dan Wishlist. Satu process, satu deployment, satu login.

Bot Telegram-nya (teks/reply) tetap berbahasa Indonesia. Web dashboard (termasuk Hub, Mood,
Journal, Wishlist, Spending, Calorie) pakai bahasa Inggris untuk UI-nya.

## Fitur

**Bot Spending** — ketik `kopi 25k` atau kirim foto struk, `/today` `/week` `/month` `/budget`,
`cari`, `/topup`, `/undo`.

**Bot Calorie** — kirim foto makanan atau ketik `makan <deskripsi>`, `/today` `/week` `/makro`
(kalori + protein/karbo/lemak/**gula**), `target` (termasuk target gula opsional), `bb`, `cari`,
`edit`, `hapus`.

**Dashboard web** — login sekali di `/login`, lanjut ke `/hub`:

- `/hub` — Personal Hub: greeting, ringkasan hari ini (Calories/Spending/Mood — tiap card bisa
  diklik ke dashboard terkait), jurnal hari ini, ringkasan wishlist, recent activity gabungan
  dari semua fitur, dan navigasi ke semua tracker/mini-app
- `/hub/mood` — Mood Tracker: input mood cepat (bisa berkali-kali sehari, tiap check-in
  kesimpen terpisah), kalender bulanan ala GitHub contribution graph (klik tanggal buat lihat
  detail check-in hari itu), ringkasan bulanan, current streak, riwayat mood
- `/hub/journal` — Brain dump harian: satu entry per hari (bisa diedit lagi kalau dibuka ulang
  di hari yang sama), riwayat entry lama bisa dibuka & diedit juga
- `/hub/wishlist` — daftar barang/hal yang pengen dibeli/dicoba: kategori, prioritas, status,
  estimasi harga, catatan — tambah/edit/hapus langsung dari list
- `/dashboard/spending` — running balance, budget mingguan, breakdown kategori, tren 7 hari,
  transaksi terakhir, form catat pengeluaran (teks/foto) & topup budget
- `/dashboard/calorie` — kalori & makro (protein/karbo/lemak/gula) hari ini, log hari ini,
  rekap 7 hari, riwayat berat badan, form catat makanan (teks/foto), catat berat badan, set
  target kalori/makro

## Struktur Project

```
src/
  server.js         entrypoint: satu express app, mount semua router, satu app.listen(PORT)
  shared/
    telegram.js       class TelegramClient(token) — instance terpisah per bot (beda token)
    supabase-client.js  satu koneksi Supabase yang dipakai bareng
    supabase-app-users.js  query tabel app_users (getUserByUsername, getAllUserPhones, createUser)
    auth.js            session cookie (sign/verify) + halaman login
    users.js            verifikasi login & allow-list chat id (dari app_users)
    dashboard-layout.js  CSS, escapeHtml, stackedBarChartSvg, navHeader — dipakai semua dashboard
  spending/
    router.js          webhook Telegram (POST /webhook/spending) + route dashboard spending
    gemini.js            baca struk foto (Gemini vision)
    categorize.js         kategorisasi keyword matching (12 kategori, bukan AI)
    parse.js               parsing input teks jadi daftar transaksi
    supabase.js             query expense_logs & expense_settings
    dashboard.js             render HTML dashboard spending
  calorie/
    router.js          webhook Telegram (POST /webhook/calorie) + route dashboard kalori
    gemini.js            analisis foto/teks makanan (Gemini)
    supabase.js            query food_logs, user_settings, weight_logs
    dashboard.js             render HTML dashboard kalori
  hub/
    router.js          route /hub (Personal Hub overview, agregasi dari semua fitur)
    dashboard.js         render HTML Hub overview
    mood/
      router.js          route /hub/mood (GET + POST)
      supabase.js          query mood_logs
      dashboard.js         render HTML Mood Tracker + kalender
    journal/
      router.js          route /hub/journal (GET + POST)
      supabase.js          query journal_logs (upsert per phone+journal_date)
      dashboard.js         render HTML Journal
    wishlist/
      router.js          route /hub/wishlist + /hub/wishlist/:id/update + /hub/wishlist/:id/delete
      supabase.js          query wishlist_items
      dashboard.js         render HTML Wishlist
scripts/
  add-user.js         CLI buat nambah akun baru (shared, satu untuk kedua bot)
supabase/
  schema.sql          definisi semua tabel + migrasi
```

## Prasyarat

- Node.js 18+
- Akun [Supabase](https://supabase.com) (gratis)
- **Dua** bot Telegram (bikin lewat [@BotFather](https://t.me/BotFather)) — satu untuk
  spending, satu untuk kalori
- API key [Gemini](https://aistudio.google.com/apikey) (gratis, dipakai bareng oleh keduanya)

## Setup

### 1. Install dependencies

```
npm install
```

### 2. Setup Supabase

1. Bikin project baru di [supabase.com](https://supabase.com), atau pakai project lama.
2. Buka **SQL Editor**, jalanin isi `supabase/schema.sql` (aman dijalanin berkali-kali — semua
   `create table if not exists`, nggak ada drop table). Tabel-tabelnya: `expense_logs`,
   `expense_settings` (spending), `food_logs`, `user_settings`, `weight_logs` (calorie),
   `mood_logs`, `journal_logs`, `wishlist_items` (Personal Hub), `app_users` (akun).
3. Buka **Storage**, bikin dua bucket: **`receipt-photos`** (foto struk) dan **`food-photos`**
   (foto makanan) — centang public read kalau mau URL foto langsung diakses browser.
4. Buka **Settings → API**, catat `Project URL` dan `service_role` key (bukan `anon` key).

### 3. Setup dua bot Telegram

Chat [@BotFather](https://t.me/BotFather), `/newbot` dua kali (nama beda), catat kedua token.

### 4. Isi environment variables

Copy `.env.example` jadi `.env`, isi semua — lihat komentar di file itu untuk detail tiap
variable. Intinya: `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SESSION_SECRET`
dipakai bareng oleh kedua bot; `TELEGRAM_BOT_TOKEN_SPENDING` dan `TELEGRAM_BOT_TOKEN_CALORIE`
masing-masing punya token sendiri.

Siapa aja yang boleh pakai bot & dashboard web diatur di tabel Supabase `app_users`, bukan
dari `.env`.

### 5. Tambah akun pertama

```
node scripts/add-user.js <username> <password> <phone>
```

`<phone>` di sini maksudnya **chat ID Telegram** kamu (bukan nomor HP) — cara dapetin: chat
[@userinfobot](https://t.me/userinfobot). Satu akun ini otomatis bisa dipakai untuk kedua bot,
kedua dashboard, dan seluruh Personal Hub (tabel `app_users` di-share).

### 6. Jalanin lokal

```
npm start
```

Buka `http://localhost:3000/login`, abis login lanjut otomatis ke `/hub`. Buat nerima pesan
Telegram beneran di local, expose local server ke internet (mis. pakai
[ngrok](https://ngrok.com)) lalu set webhook (lihat langkah 8).

## Deploy ke Render

1. Push repo ini ke GitHub.
2. Render dashboard → **New +** → **Web Service** → connect ke repo ini.
3. Build command: `npm install`. Start command: `npm start`.
4. Environment tab, isi semua variable di `.env.example` (kecuali `PORT` — Render nyuntik
   port-nya sendiri).
5. Deploy, tunggu status "Live", catat URL-nya (mis. `https://mylo-track.onrender.com`).

### 7. Set webhook kedua bot Telegram

```
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN_SPENDING>/setWebhook?url=<URL_RENDER>/webhook/spending"
curl "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN_CALORIE>/setWebhook?url=<URL_RENDER>/webhook/calorie"
```

Cek status webhook kapan aja dengan `.../bot<TOKEN>/getWebhookInfo`.

## Menambah user baru

```
node scripts/add-user.js <username> <password> <phone>
```

Jalanin dari local (butuh `.env` yang bener biar bisa konek ke Supabase). User baru langsung
bisa dipakai di production begitu di-run, tidak perlu redeploy.

## Troubleshooting

- **Login gagal padahal password bener** — cek `SESSION_SECRET` udah ke-set di Render.
- **Salah satu bot nggak respon** — cek `getWebhookInfo` bot yang bermasalah, pastiin `url`
  sesuai domain Render + path yang benar (`/webhook/spending` atau `/webhook/calorie`), dan
  `pending_update_count` nggak menumpuk (kalau menumpuk cek log Render).
- **Foto nggak kesimpen** — pastiin bucket `receipt-photos`/`food-photos` udah dibikin di
  Supabase Storage.
- **Dashboard nggak nunjukin data** — pastiin `phone` di tabel `app_users` buat akun kamu
  sama persis dengan chat ID Telegram yang dipakai buat chat ke bot terkait.
- **`/hub/mood`, `/hub/journal`, atau `/hub/wishlist` error pas load** — pastiin udah jalanin
  ulang `supabase/schema.sql` versi terbaru (nambah tabel `mood_logs`, `journal_logs`,
  `wishlist_items`) di project Supabase kamu.
