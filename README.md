# SEAPEDIA - SE Academy Compfest 2026

Marketplace multi-peran yang menghubungkan **Pembeli**, **Penjual**, dan
**Pengantar** dalam satu ekosistem — dibangun untuk Technical Challenge
Software Engineering Academy COMPFEST 18.

> **Status pengerjaan: SELESAI Level 1–7 (core challenge 100 poin).**
> Level 1: Public Marketplace & Auth multi-role · Level 2: Seller Experience ·
> Level 3: Buyer Wallet, Cart, Checkout · Level 4: Diskon, Pemrosesan Pesanan,
> Laporan · Level 5: Delivery & Driver Workflow · Level 6: Admin Monitoring &
> Overdue Handling · Level 7: Security Hardening & Finalisasi.

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

> **Keamanan** (bcrypt, sesi JWT server-side, ORM anti-SQLi, XSS-safe,
> RBAC per role-aktif) didokumentasikan lengkap di bagian
> [Catatan Keamanan (Level 7)](#catatan-keamanan-level-7) di bawah.

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

## Admin Monitoring & Overdue Handling (Level 6)

### Dashboard Monitoring

Admin (role aktif ADMIN) memantau seluruh marketplace via tab dashboard:
pengguna, toko, produk, pesanan (dengan penanda overdue), pengiriman, voucher
& promo, serta pesanan overdue. Ringkasan angka kunci ada di tab Ringkasan.
Semua endpoint `/api/admin/*` hanya dapat diakses role aktif ADMIN.

### Manajemen Voucher & Promo

UI Admin lengkap untuk generate voucher/promo dan melihat daftar + detail
(kadaluarsa, kuota, status aktif/kadaluarsa) — tab "Voucher & Promo".

### SLA Pengiriman

| Metode   | SLA (batas waktu penyelesaian) |
| -------- | ------------------------------ |
| Instant  | 24 jam                         |
| Next Day | 48 jam                         |
| Regular  | 96 jam                         |

Deadline sebuah pesanan = `waktu checkout + SLA metode`. Pesanan **overdue**
jika belum mencapai status terminal (Pesanan Selesai / Dikembalikan) dan waktu
efektif sudah melewati deadline.

### Simulasi Waktu (Maju Hari)

Karena SLA dihitung dalam jam/hari, disediakan **jam simulasi**: Admin dapat
memajukan waktu (`POST /api/admin/clock/advance?days=N`) tanpa menunggu waktu
nyata. Offset ini **hanya memengaruhi evaluasi SLA overdue**, tidak memengaruhi
kadaluarsa token/sesi login. Reset dengan `POST /api/admin/clock/reset`.

### Auto Refund + Auto Return

`POST /api/admin/overdue/run` memproses semua pesanan overdue. Untuk setiap
pesanan yang melewati SLA:

1. **Refund penuh** `order.total` dikembalikan ke wallet Buyer + dicatat sebagai
   transaksi `REFUND` di riwayat wallet.
2. **Stok dipulihkan** sesuai kuantitas tiap item (penambahan atomik; produk
   yang sudah dihapus dilewati).
3. **Status → Dikembalikan**, dicatat di riwayat status dengan timestamp
   (jejak yang terlihat, bukan perubahan diam-diam).
4. **Pendapatan Seller**: laporan pendapatan hanya menghitung pesanan
   *Pesanan Selesai*, sehingga pesanan *Dikembalikan* otomatis tidak dihitung
   sebagai pendapatan Seller — penyesuaian yang jelas dan konsisten.

**Idempotensi & pencegahan double-processing**: hanya pesanan berstatus
non-terminal yang diproses. Setelah menjadi *Dikembalikan* (terminal), pesanan
tidak akan diproses lagi, sehingga **tidak mungkin terjadi double refund,
double restore stok, atau double reversal** untuk pesanan yang sama.

Endpoint Level 6 (semua butuh **role aktif ADMIN**):

| Method | Endpoint                        | Keterangan                          |
| ------ | ------------------------------- | ----------------------------------- |
| GET    | `/api/admin/summary`            | Ringkasan angka marketplace         |
| GET    | `/api/admin/users`              | Monitoring pengguna                 |
| GET    | `/api/admin/stores`             | Monitoring toko                     |
| GET    | `/api/admin/products`           | Monitoring produk                   |
| GET    | `/api/admin/orders`             | Monitoring pesanan (filter status)  |
| GET    | `/api/admin/deliveries`         | Monitoring job pengiriman           |
| GET    | `/api/admin/overdue`            | Pesanan overdue saat ini            |
| GET    | `/api/admin/clock`              | Status jam simulasi                 |
| POST   | `/api/admin/clock/advance`      | Majukan waktu N hari                |
| POST   | `/api/admin/clock/reset`        | Reset offset simulasi               |
| POST   | `/api/admin/overdue/run`        | Proses refund+return semua overdue  |
| GET/POST | `/api/admin/vouchers`         | List / generate voucher (Level 4)   |
| GET/POST | `/api/admin/promos`           | List / generate promo (Level 4)     |

## Catatan Keamanan (Level 7)

### SQL Injection

Seluruh akses database memakai **SQLAlchemy ORM / Core**. Setiap nilai input
di-bind sebagai parameter query, bukan digabung ke string SQL. Tidak ada satu
pun raw SQL string di codebase. Contoh: pencarian katalog memakai
`Product.name.ilike(f"%{search}%")` — nilai `search` tetap dikirim sebagai
parameter terikat, sehingga payload seperti `' OR 1=1 --` diperlakukan sebagai
teks literal (menghasilkan 0 kecocokan), bukan perintah SQL.

### XSS (Cross-Site Scripting)

- Semua konten buatan pengguna (review aplikasi, nama, deskripsi) dirender oleh
  **React sebagai teks**, yang otomatis meng-escape karakter HTML. Tidak ada
  penggunaan `dangerouslySetInnerHTML` di seluruh frontend.
- Akibatnya, komentar berisi `<script>alert('xss')</script>` tampil apa adanya
  sebagai teks dan **tidak pernah dieksekusi**, serta tidak merusak layout
  (komentar dibungkus `break-words`).
- Lapisan tambahan di server: `clean_text()` membuang karakter kontrol tak
  terlihat dari input publik dan merapikan spasi.

### Validasi Input

Validasi memakai **Pydantic** di setiap payload, dengan pesan error jelas
(HTTP 422):

| Field       | Aturan                                              |
| ----------- | --------------------------------------------------- |
| email       | Format email valid (`EmailStr`)                     |
| phone       | 8–15 digit angka (regex)                            |
| rating      | Integer 1–5                                         |
| quantity    | Integer ≥ 1                                         |
| price       | Integer > 0                                         |
| stock       | Integer ≥ 0                                         |
| discount %  | Integer 1–100; nominal ≥ 0                          |
| username    | 3–30 char alfanumerik/underscore                    |
| password    | Minimal 8 karakter                                  |

Input berbahaya/tak valid ditolak dengan status 422 dan detail field.

### Sesi & Autentikasi

- Password disimpan sebagai hash **bcrypt** (tidak pernah plaintext).
- Autentikasi memakai **JWT Bearer** yang `jti`-nya menunjuk ke **sesi
  server-side** (`auth_sessions`). **Logout menghapus baris sesi**, sehingga
  token yang sama langsung tidak berlaku (bukan sekadar dihapus di klien).
- **Masa berlaku token/sesi: 24 jam** (dapat diatur via `TOKEN_EXPIRE_HOURS`).
  Token yang kedaluwarsa atau rusak ditolak 401.

### Role-Based Access Control (RBAC)

- **Backend adalah otoritas tunggal.** Setiap endpoint privat memakai
  dependency `require_active_role(...)` yang memverifikasi **role aktif sesi**
  di server — UI tidak dipercaya. Mengubah route frontend secara manual tidak
  memberi akses karena API tetap menolak (403).
- Otorisasi berdasar **role aktif**, bukan sekadar daftar role yang dimiliki:
  user multi-role yang aktif sebagai BUYER tetap ditolak di endpoint SELLER
  sampai ia mengganti role aktif.
- **Isolasi kepemilikan**: Seller hanya bisa mengubah produk/tokonya sendiri,
  Buyer hanya melihat pesanan/alamatnya sendiri, Driver hanya job miliknya —
  akses lintas-user ditolak 403/404.
- Endpoint & halaman Admin hanya untuk role aktif ADMIN; akun ADMIN tidak bisa
  dibuat lewat registrasi publik (hanya via seed).

### Ringkasan Uji Keamanan (dapat didemokan)

| Uji                                            | Hasil                        |
| ---------------------------------------------- | ---------------------------- |
| `<script>` di komentar review                  | Tersimpan & tampil sbg teks  |
| `' OR '1'='1` di login                          | Ditolak 401                  |
| Payload SQLi di pencarian                       | Jadi literal, 0 hasil        |
| Registrasi role ADMIN                           | Ditolak 422                  |
| BUYER akses endpoint SELLER/DRIVER/ADMIN        | Ditolak 403                  |
| Akses pesanan/alamat milik user lain            | Ditolak 404                  |
| Pakai token setelah logout                      | Ditolak 401                  |
| Field tak valid (rating 0, harga negatif, dll.) | Ditolak 422                  |

## Panduan Testing End-to-End (Demo)

Alur lengkap untuk mendemokan seluruh sistem. Jalankan backend & frontend
(lihat [Menjalankan Proyek](#menjalankan-proyek)), buka `http://localhost:5173`.

**1. Guest & Review (Level 1)**
- Buka beranda tanpa login → jelajahi katalog & detail produk.
- Di beranda, kirim review aplikasi (rating + komentar) tanpa login → tampil di
  daftar. Coba komentar `<script>alert(1)</script>` → tampil sebagai teks biasa.

**2. Auth & Multi-Role (Level 1)**
- Login `rina` / `Multi123!` → muncul halaman pilih role (punya 3 role) → pilih
  peran → dashboard sesuai peran. Ganti peran aktif dari navbar/dashboard.

**3. Seller (Level 2)**
- Login `tokomaju` / `Seller123!` → dashboard Penjual → tambah/ubah/hapus
  produk. Coba buat toko baru bernama "Warung Ijo" (akun seller baru) → ditolak
  (nama kembar). Produk baru langsung muncul di katalog publik.

**4. Buyer: Wallet → Cart → Checkout (Level 3)**
- Login `budi` / `Buyer123!` → dashboard Pembeli → top-up saldo.
- Buka produk → tambah ke keranjang. Coba tambah produk dari toko berbeda →
  muncul aturan single-store (tawaran kosongkan keranjang).
- Checkout: pilih alamat & metode kirim → ringkasan menampilkan subtotal,
  diskon, ongkir, PPN 12%, total → bayar dengan wallet.

**5. Diskon & Proses Pesanan (Level 4)**
- Di checkout, masukkan kode `HEMAT10` (voucher) atau `GAJIAN` (promo) → PPN
  menyesuaikan (diskon sebelum pajak). Kode `KADALUARSA` → ditolak.
- Login `tokomaju` → Pesanan Masuk → **Proses Pesanan** → status jadi
  "Menunggu Pengirim". Cek Laporan Pendapatan.
- Cek Laporan Pengeluaran di dashboard Buyer.

**6. Driver (Level 5)**
- Login `dika` / `Driver123!` → dashboard Pengantar → job muncul (setelah
  diproses seller) → **Ambil Job** (status "Sedang Dikirim") → **Konfirmasi
  Selesai** (status "Pesanan Selesai") → penghasilan bertambah 80% ongkir.
- Buka dua sesi driver (`dika` & `rina` sbg Driver) untuk menguji: hanya satu
  yang berhasil ambil job yang sama.

**7. Admin, Overdue & Simulasi Waktu (Level 6)**
- Login `admin` / `Admin123!` → dashboard Admin → jelajahi tab monitoring.
- Tab "Voucher & Promo" → generate voucher/promo baru.
- Tab "Overdue & Simulasi": buat dulu 1 pesanan (Buyer) yang tidak diselesaikan
  → di sini **majukan waktu +7 hari** → pesanan muncul sebagai overdue →
  **Proses Overdue** → cek: saldo Buyer di-refund penuh (transaksi REFUND),
  stok produk pulih, status pesanan "Dikembalikan".

**8. Keamanan (Level 7)** — lihat tabel Ringkasan Uji Keamanan di atas.

### Automated Smoke Tests

Skrip pengujian API per level disertakan (menguji business rule & keamanan
lewat HTTP). Dengan backend berjalan di port 8000, jalankan mis.:

```bash
# dari folder backend, dengan venv aktif
python -m app.seed            # pastikan data demo tersedia
# skrip uji ada di riwayat pengembangan; endpoint dapat diuji via /docs
```

Dokumentasi interaktif **Swagger UI** di `http://localhost:8000/docs`
memungkinkan evaluator menguji setiap endpoint langsung (klik **Authorize**,
tempel token dari `/auth/login`).
