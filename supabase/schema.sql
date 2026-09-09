-- Semua tabel di bawah pakai "create table if not exists" — aman dijalankan berkali-kali,
-- dan aman dijalankan di project Supabase yang sudah punya sebagian tabel ini dari
-- spd-track/cal-track versi sebelum digabung (tidak ada drop table).

create table if not exists expense_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  description text,
  category text,
  amount numeric not null,
  type text not null default 'Expense',
  balance_after numeric,
  image_url text,
  created_at timestamptz not null default now()
);

-- created_at bisa nge-tie (sampai microsecond) kalau beberapa baris di-insert dalam satu
-- batch (lihat saveExpenseLogsBatch) - "order by created_at" doang nggak jamin urutan yang
-- benar pas ada tie, jadi butuh kolom yang beneran monotonic buat nentuin transaksi terakhir
alter table expense_logs add column if not exists seq bigserial;

create table if not exists expense_settings (
  phone text primary key,
  weekly_budget numeric,
  updated_at timestamptz not null default now()
);

alter table expense_logs enable row level security;
alter table expense_settings enable row level security;
alter table expense_logs add column if not exists image_url text;

-- bucket buat simpan foto struk (jalankan lewat Supabase dashboard > Storage, bukan SQL Editor)
-- nama bucket: receipt-photos (set public read kalau mau image_url langsung diakses browser)

create table if not exists food_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  food_name text,
  calories int,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  sugar_g numeric,
  notes text,
  items jsonb,
  image_url text,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create table if not exists user_settings (
  phone text primary key,
  daily_target int,
  protein_target_g numeric,
  carbs_target_g numeric,
  fat_target_g numeric,
  sugar_target_g numeric,
  updated_at timestamptz not null default now()
);

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  weight_kg numeric not null,
  created_at timestamptz not null default now()
);

alter table food_logs enable row level security;
alter table user_settings enable row level security;
alter table weight_logs enable row level security;
alter table user_settings alter column daily_target drop not null;
alter table user_settings add column if not exists protein_target_g numeric;
alter table user_settings add column if not exists carbs_target_g numeric;
alter table user_settings add column if not exists fat_target_g numeric;
alter table user_settings add column if not exists sugar_target_g numeric;
alter table food_logs add column if not exists items jsonb;
alter table food_logs add column if not exists sugar_g numeric;

-- bucket buat simpan foto makanan (jalankan lewat Supabase dashboard > Storage, bukan SQL Editor)
-- nama bucket: food-photos (set public read kalau mau image_url langsung diakses browser)

create table if not exists mood_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  mood text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table mood_logs enable row level security;

-- satu entry per hari per user (di-upsert lewat onConflict "phone,journal_date")
create table if not exists journal_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  journal_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (phone, journal_date)
);
alter table journal_logs enable row level security;

create table if not exists wishlist_items (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  title text not null,
  category text not null default 'Other',
  estimated_price numeric,
  priority text not null default 'Medium',
  status text not null default 'Thinking',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table wishlist_items enable row level security;

create table if not exists income_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);
alter table income_logs enable row level security;

-- type: 'deposit' | 'withdrawal'
create table if not exists savings_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  amount numeric not null,
  type text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table savings_logs enable row level security;

create table if not exists bill_templates (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text not null,
  default_amount numeric,
  created_at timestamptz not null default now()
);
alter table bill_templates enable row level security;

-- "name" disalin dari bill_templates pas dibayar (bukan FK) - kalau template-nya diedit atau
-- dihapus belakangan, histori pembayaran lama tetap utuh
create table if not exists bill_payments (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  name text not null,
  amount numeric not null,
  created_at timestamptz not null default now()
);
alter table bill_payments enable row level security;

-- pengeluaran sekali-jalan yang bukan bill rutin (bukan cocok masuk bill_templates) - tetep
-- ngurangin monthly pool tapi ga perlu bikin template buat sesuatu yang cuma kejadian sekali
create table if not exists misc_expense_logs (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);
alter table misc_expense_logs enable row level security;

-- Tabel akun web, dipakai bareng oleh dashboard spending & kalori (satu login untuk keduanya).
-- "phone" di sini merujuk ke chat id Telegram-nya (dipakai buat filter data & jadi
-- allow-list Telegram sekaligus, untuk kedua bot).
create table if not exists app_users (
  username text primary key,
  password_hash text not null,
  password_salt text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
alter table app_users enable row level security;
