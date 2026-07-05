# SEAPEDIA 🌊

Marketplace multi-peran yang menghubungkan **Pembeli**, **Penjual**, dan
**Pengantar** dalam satu ekosistem — dibangun untuk Technical Challenge
Software Engineering Academy COMPFEST 18.

> **Status pengerjaan: Level 5 selesai** (Level 1: Public Marketplace &
> Auth multi-role · Level 2: Seller Experience · Level 3: Buyer Wallet,
> Cart, Checkout · Level 4: Diskon, Pemrosesan Pesanan, Laporan · Level 5:
> Delivery & Driver Workflow). Level berikutnya sedang dikerjakan bertahap —
> lihat riwayat commit.

## Tech Stack

| Bagian   | Teknologi                                                   |
| -------- | ----------------------------------------------------------- |
| Backend  | Python 3.11+, FastAPI, SQLAlchemy 2, SQLite (default) / PostgreSQL, JWT (PyJWT), bcrypt |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7              |
| Dok. API | Swagger UI & ReDoc bawaan FastAPI (`/docs`, `/redoc`)       |

## Menjalankan Proyek

Butuh **Python 3.11+** dan **Node.js 18+**.

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python -m app.seed          # isi database dengan akun & data demo
uvicorn app.main:app --reload --port 8000
```

Backend berjalan di `http://localhost:8000` — dokumentasi API interaktif di
`http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:5173`. Saat development, request `/api`
otomatis di-proxy ke backend (lihat `vite.config.js`), jadi tidak perlu
mengatur CORS/env apa pun.

### Environment Variables

Semua opsional saat development (sudah ada default). Salin `.env.example`
menjadi `.env` untuk mengubahnya.

**backend/.env**

| Variabel             | Default                  | Keterangan                                  |
| -------------------- | ------------------------ | ------------------------------------------- |
| `DATABASE_URL`       | `sqlite:///./seapedia.db`| URL SQLAlchemy; dukung PostgreSQL           |
| `JWT_SECRET`         | (dev only)               | **Wajib diganti di production**             |
| `TOKEN_EXPIRE_HOURS` | `24`                     | Masa berlaku token/sesi                     |
| `CORS_ORIGINS`       | `http://localhost:5173`  | Origin frontend, pisahkan dengan koma       |

**frontend/.env**

| Variabel       | Default | Keterangan                                        |
| -------------- | ------- | ------------------------------------------------- |
| `VITE_API_URL` | (kosong)| Kosong = pakai proxy dev. Isi URL backend saat production |

## Akun Demo (Seed Data)

Dibuat oleh `python -m app.seed`:

| Username    | Password     | Peran                  | Catatan                          |
| ----------- | ------------ | ---------------------- | -------------------------------- |
| `admin`     | `Admin123!`  | Admin                  | Dibuat hanya lewat seed (lihat bawah) |
| `tokomaju`  | `Seller123!` | Seller                 | Toko: Toko Maju Jaya             |
| `warungijo` | `Seller123!` | Seller                 | Toko: Warung Ijo                 |
| `budi`      | `Buyer123!`  | Buyer                  |                                  |
| `dika`      | `Driver123!` | Driver                 |                                  |
| `rina`      | `Multi123!`  | Buyer + Seller + Driver| Demo pemilihan peran aktif       |

### Setup Akun Admin

Akun Admin **tidak bisa dibuat melalui registrasi publik** — ini disengaja.
Admin dibuat melalui seed data (`python -m app.seed` membuat user `admin`).
Untuk menambah admin lain, tambahkan entri pada `DEMO_USERS` di
`backend/app/seed.py` lalu jalankan ulang seed (idempoten — data lama tidak
diduplikasi).

## Konsep Multi-Role & Peran Aktif

Aturan inti yang diimplementasikan sejak Level 1:

- Satu username non-admin boleh memiliki beberapa peran sekaligus
  (Buyer, Seller, Driver).
- Setelah login, user **multi-peran wajib memilih peran aktif** sebelum bisa
  membuka dashboard privat (halaman `/select-role`).
- **Otorisasi backend mengikuti peran aktif sesi**, bukan daftar semua peran
  yang dimiliki (dependency `require_active_role` di `backend/app/deps.py`).
- Peran aktif selalu terlihat di navbar dan bisa diganti kapan saja.
- Perilaku Admin dipisah dari multi-role non-admin: akun admin bersifat
  admin-only, langsung aktif sebagai `ADMIN` saat login, dan hanya dibuat
  melalui seed.

## Sesi & Keamanan (ringkasan Level 1)

- Password disimpan sebagai hash **bcrypt**.
- Autentikasi memakai **JWT Bearer** dengan `jti` yang menunjuk ke **sesi
  server-side** — logout menghapus sesi sehingga token lama benar-benar tidak
  bisa dipakai lagi (bukan hanya dihapus di sisi klien).
- Token kedaluwarsa dalam 24 jam (bisa diatur via `TOKEN_EXPIRE_HOURS`).
- Semua query database melalui SQLAlchemy ORM (parameterized — aman dari SQL
  Injection).
- Komentar review disimpan sebagai teks polos dan dirender sebagai teks oleh
  React (escaped otomatis) — skrip tidak pernah dieksekusi. Hardening formal
  dinilai di Level 7.
- Validasi input memakai Pydantic: format email, panjang username/password,
  rating 1–5, dsb.

## Review Aplikasi (Publik)

Review/testimoni tentang **aplikasi** (bukan produk) dapat dikirim oleh siapa
pun — guest maupun user login — tanpa perlu checkout/transaksi, melalui
form di beranda. Data tersimpan di backend (`POST /api/reviews`).

## Struktur Proyek

```
backend/
  app/
    main.py        # entry FastAPI + CORS + registrasi router
    config.py      # settings dari env
    database.py    # engine & session SQLAlchemy
    models.py      # semua model data
    security.py    # bcrypt + JWT
    deps.py        # dependency auth & otorisasi role aktif
    routers/       # auth, catalog (publik), reviews
    schemas/       # skema request/response Pydantic
    seed.py        # data demo
frontend/
  src/
    components/    # UI reusable: Button, Input, Card, Badge, Navbar, Footer, dll.
    context/       # AuthContext (token, user, role aktif)
    lib/           # api client, formatter, metadata role
    pages/         # halaman publik, auth, dashboard, shell per peran
```

## Dokumentasi API

Swagger UI: `http://localhost:8000/docs` (interaktif, mendukung Authorize
dengan Bearer token) · ReDoc: `http://localhost:8000/redoc`.

Ringkasan endpoint Level 1:

| Method | Endpoint                | Akses          | Keterangan                         |
| ------ | ----------------------- | -------------- | ---------------------------------- |
| POST   | `/api/auth/register`    | Publik         | Registrasi (multi-role non-admin)  |
| POST   | `/api/auth/login`       | Publik         | Login → token + kebutuhan pilih role |
| POST   | `/api/auth/select-role` | Login          | Pilih/ganti peran aktif sesi       |
| POST   | `/api/auth/logout`      | Login          | Hapus sesi (invalidasi token)      |
| GET    | `/api/auth/me`          | Login          | Profil + peran + ringkasan finansial |
| GET    | `/api/products`         | Publik         | Katalog produk (search, pagination)|
| GET    | `/api/products/{id}`    | Publik         | Detail produk + info toko          |
| GET    | `/api/stores/{id}`      | Publik         | Ringkasan toko + produknya         |
| GET    | `/api/reviews`          | Publik         | Daftar review aplikasi             |
| POST   | `/api/reviews`          | Publik (guest) | Kirim review aplikasi              |

Endpoint Level 2 (semua butuh **role aktif SELLER**):

| Method | Endpoint                     | Keterangan                                  |
| ------ | ---------------------------- | ------------------------------------------- |
| GET    | `/api/seller/store`          | Profil toko sendiri (null jika belum punya) |
| POST   | `/api/seller/store`          | Buat toko (nama unik, satu toko per Seller) |
| PUT    | `/api/seller/store`          | Ubah profil toko sendiri                    |
| GET    | `/api/seller/products`       | Daftar produk toko sendiri                  |
| POST   | `/api/seller/products`       | Tambah produk ke toko sendiri               |
| PUT    | `/api/seller/products/{id}`  | Ubah produk (hanya milik sendiri)           |
| DELETE | `/api/seller/products/{id}`  | Hapus produk (hanya milik sendiri)          |

## Aturan Bisnis Seller (Level 2)

- **Nama toko unik** — ditegakkan ganda: unique constraint di database dan
  validasi backend case-insensitive ("Toko A" vs "toko a" dianggap sama),
  dengan pesan error yang jelas di form.
- **Satu Seller satu toko**; Seller hanya dapat mengelola tokonya sendiri.
- **Kepemilikan produk diverifikasi di backend**: mengubah/menghapus produk
  toko lain ditolak 403, bukan sekadar disembunyikan di UI.
- **Stok disimpan** di model produk karena dipakai checkout di Level 3.
- Katalog publik (`/api/products`) sepenuhnya memakai data backend — produk
  yang dibuat Seller langsung tampil untuk guest, lengkap dengan info toko
  dan halaman toko publik (`/stores/:id`).

## Aturan Transaksi Buyer (Level 3)

### Single-Store Checkout

**Satu keranjang hanya boleh berisi produk dari satu toko.** Aturan ini:

- Ditegakkan di **backend**: `POST /api/buyer/cart/items` menolak dengan
  `409 Conflict` jika produk berasal dari toko yang berbeda dengan isi
  keranjang saat ini.
- Ditampilkan di **UI**: halaman keranjang menjelaskan aturan ini, dan saat
  konflik terjadi Buyer ditawari tombol "Kosongkan & Tambahkan" untuk
  berpindah toko secara sadar.
- Konsekuensinya, satu checkout selalu menghasilkan **satu pesanan untuk
  satu toko**.

### Perhitungan Checkout (PPN 12%)

```
subtotal = Σ (harga produk × kuantitas)
diskon   = 0 (Voucher/Promo hadir di Level 4)
PPN 12%  = 12% × (subtotal − diskon)   ← dibulatkan ke rupiah terdekat
total    = subtotal − diskon + ongkir + PPN
```

Catatan tax base: **PPN dihitung dari nilai barang setelah diskon; ongkos
kirim tidak dikenai PPN.** Rincian subtotal, diskon, ongkir, PPN 12%, dan
total selalu ditampilkan di ringkasan checkout (sebelum konfirmasi) dan di
detail pesanan.

### Ongkos Kirim per Metode

| Metode   | Ongkir     | Estimasi                       |
| -------- | ---------- | ------------------------------ |
| Instant  | Rp25.000   | Tiba hari yang sama            |
| Next Day | Rp15.000   | Tiba keesokan hari             |
| Regular  | Rp8.000    | Tiba 2-4 hari                  |

### Aturan Checkout Lainnya

- Saldo wallet tidak cukup → checkout ditolak `400` dengan pesan yang jelas;
  top-up bersifat dummy/simulasi tetapi saldo & riwayat transaksi tersimpan
  nyata di database.
- Stok dikurangi secara **atomik** (`UPDATE … WHERE stock >= qty`) sehingga
  stok tidak pernah negatif meski ada checkout bersamaan; jika stok kurang,
  checkout dibatalkan `409`.
- Pembayaran memotong wallet dan tercatat sebagai transaksi `PAYMENT`.
- Status awal pesanan: **"Sedang Dikemas"**; setiap perubahan status tercatat
  di riwayat status dengan timestamp (tabel `order_status_history`).
- Pesanan menyimpan **snapshot** alamat dan harga produk saat checkout,
  sehingga perubahan data setelahnya tidak mengubah pesanan lama.

Endpoint Level 3 (semua butuh **role aktif BUYER**, kecuali disebut lain):

| Method | Endpoint                        | Keterangan                              |
| ------ | ------------------------------- | --------------------------------------- |
| GET    | `/api/buyer/wallet`             | Saldo + riwayat transaksi wallet        |
| POST   | `/api/buyer/wallet/topup`       | Top-up dummy (10rb - 10jt)              |
| GET/POST | `/api/buyer/addresses`        | Kelola alamat pengiriman                |
| PUT/DELETE | `/api/buyer/addresses/{id}` | Ubah/hapus alamat milik sendiri         |
| GET    | `/api/buyer/cart`               | Isi keranjang                           |
| POST   | `/api/buyer/cart/items`         | Tambah produk (aturan satu-toko, 409)   |
| PUT/DELETE | `/api/buyer/cart/items/{id}`| Ubah kuantitas / hapus item             |
| DELETE | `/api/buyer/cart`               | Kosongkan keranjang                     |
| GET    | `/api/buyer/delivery-methods`   | Daftar metode & ongkir                  |
| POST   | `/api/buyer/checkout/preview`   | Ringkasan sebelum konfirmasi            |
| POST   | `/api/buyer/checkout`           | Buat pesanan (potong saldo & stok)      |
| GET    | `/api/buyer/orders`             | Riwayat pesanan Buyer                   |
| GET    | `/api/buyer/orders/{id}`        | Detail pesanan + timeline status        |
| GET    | `/api/seller/orders`            | (SELLER) Pesanan masuk toko sendiri     |
| GET    | `/api/seller/orders/{id}`       | (SELLER) Detail pesanan toko sendiri    |

## Diskon: Voucher & Promo (Level 4)

SEAPEDIA mendukung dua jenis diskon yang dibedakan secara eksplisit:

| Aspek            | **Voucher**                       | **Promo**                     |
| ---------------- | --------------------------------- | ----------------------------- |
| Batas waktu      | Punya tanggal kadaluarsa          | Punya tanggal kadaluarsa      |
| Batas pemakaian  | Punya sisa kuota (`remaining_usage`) | Tanpa kuota                |
| Potongan         | Persentase (opsional `max_discount`, `min_spend`) | Sama         |

### Aturan Kombinasi (PENTING)

**Voucher dan Promo TIDAK bisa digabung.** Satu checkout menerima **maksimal
satu kode diskon**. Sistem mendeteksi otomatis apakah kode yang dimasukkan
adalah Voucher atau Promo, lalu menampilkannya dengan jelas di ringkasan
checkout (badge "Voucher"/"Promo" + kode).

### Posisi Diskon terhadap PPN 12%

Urutan perhitungan konsisten dan didokumentasikan:

```
subtotal = Σ (harga × kuantitas)
diskon   = potongan dari Voucher/Promo (dibatasi max_discount, syarat min_spend)
PPN 12%  = 12% × (subtotal − diskon)   ← diskon diterapkan SEBELUM pajak
total    = subtotal − diskon + ongkir + PPN
```

Jadi **diskon mengurangi basis pajak** — semakin besar diskon, semakin kecil
PPN. Ongkir tidak pernah dikenai PPN.

### Aturan Validasi

- Voucher/Promo kadaluarsa → ditolak `400`.
- Voucher tanpa sisa kuota → ditolak `400`.
- Subtotal di bawah `min_spend` → ditolak `400`.
- Kode tidak ditemukan → `404`.
- Diskon tidak pernah melebihi subtotal.
- Kuota voucher berkurang **hanya setelah checkout berhasil** (bukan saat
  preview), sehingga preview tidak "membakar" kuota.

Kode diskon disiapkan melalui **seed data** dan **endpoint Admin**
(`POST /api/admin/vouchers`, `POST /api/admin/promos`). UI manajemen Admin
lengkap hadir di Level 6.

Kode demo hasil seed: Voucher `HEMAT10`, `NEWBIE25`, `KADALUARSA` (sengaja
expired); Promo `GAJIAN`, `ONGKIRHEMAT`.

## Pemrosesan Pesanan Seller (Level 4)

- Seller memproses pesanan via `POST /api/seller/orders/{id}/process`:
  status **Sedang Dikemas → Menunggu Pengirim**, tercatat di riwayat status
  dengan timestamp.
- Hanya pemilik toko yang boleh memproses pesanannya; pesanan yang sudah
  diproses tidak bisa diproses ulang (`400`).
- Sebuah pesanan **tidak tersedia bagi Driver** (Level 5) sebelum diproses
  Seller — sesuai lifecycle.

## Laporan Transaksi (Level 4)

- **Buyer** (`GET /api/buyer/report`): total pengeluaran, hemat diskon, PPN
  dibayar, dan hitungan pesanan per status. Pesanan yang dikembalikan tidak
  dihitung.
- **Seller** (`GET /api/seller/report`): pendapatan bersih (subtotal − diskon
  dari pesanan selesai), penjualan kotor, total diskon diberikan, dan
  hitungan pesanan per status. Ongkir (milik Driver) dan PPN (milik negara)
  tidak dihitung sebagai pendapatan Seller.

## Delivery & Driver Workflow (Level 5)

### Alur Job Pengiriman

```
Sedang Dikemas ──(Seller proses)──▶ Menunggu Pengirim
                                          │ (job muncul untuk Driver)
                                          ▼
                              (Driver ambil job) ──▶ Sedang Dikirim
                                          │
                              (Driver konfirmasi) ──▶ Pesanan Selesai
```

- Job hanya muncul untuk Driver saat pesanan berstatus **Menunggu Pengirim**
  dan belum diambil Driver lain. Pesanan **Sedang Dikemas** tidak terlihat.
- **Satu order hanya boleh punya satu Driver aktif.** "Ambil job" memakai
  **UPDATE bersyarat atomik**
  (`… WHERE status='Menunggu Pengirim' AND driver_id IS NULL`), sehingga bila
  dua Driver menekan tombol bersamaan hanya satu yang berhasil; yang lain
  mendapat `409`.
- Setiap transisi status tercatat di riwayat status dengan timestamp; Buyer
  dan Seller dapat memantau progres pengiriman secara real-time dari halaman
  pesanan mereka.

### Aturan Earning Driver

**Earning Driver = 80% dari ongkos kirim** pesanan yang berhasil diselesaikan
(sisanya 20% dianggap potongan platform). Contoh: metode Instant (ongkir
Rp25.000) memberi earning Rp20.000. Earning hanya dihitung untuk job berstatus
**Pesanan Selesai**.

Endpoint Level 5 (semua butuh **role aktif DRIVER**):

| Method | Endpoint                          | Keterangan                            |
| ------ | --------------------------------- | ------------------------------------- |
| GET    | `/api/driver/jobs`                | Daftar job tersedia (Menunggu Pengirim)|
| GET    | `/api/driver/jobs/{order_id}`     | Detail job (tersedia atau milik sendiri)|
| POST   | `/api/driver/jobs/{order_id}/take`| Ambil job (atomik) → Sedang Dikirim   |
| POST   | `/api/driver/jobs/{order_id}/complete` | Konfirmasi → Pesanan Selesai     |
| GET    | `/api/driver/earnings`            | Job aktif, riwayat, total earning     |

## Aturan Bisnis Level Lanjut (placeholder)

Aturan berikut disyaratkan soal dan akan didokumentasikan penuh saat levelnya
dikerjakan:

- **SLA pengiriman & simulasi hari berikutnya** (Level 6).
- **Catatan keamanan lengkap** (Level 7).
