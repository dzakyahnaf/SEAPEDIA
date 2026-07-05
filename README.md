# SEAPEDIA 🌊

Marketplace multi-peran yang menghubungkan **Pembeli**, **Penjual**, dan
**Pengantar** dalam satu ekosistem — dibangun untuk Technical Challenge
Software Engineering Academy COMPFEST 18.

> **Status pengerjaan: Level 2 selesai** (Level 1: Public Marketplace,
> Authentication multi-role, Application Reviews, Reusable UI · Level 2:
> Seller Store Management, Product Management, Public Catalog Integration).
> Level berikutnya sedang dikerjakan bertahap — lihat riwayat commit.

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

## Aturan Bisnis Level Lanjut (placeholder)

Aturan berikut disyaratkan soal dan akan didokumentasikan penuh saat levelnya
dikerjakan:

- **Single-store checkout** (Level 3): satu keranjang hanya boleh berisi
  produk dari satu toko.
- **PPN 12% & kombinasi diskon** (Level 3–4): urutan perhitungan
  subtotal → diskon → ongkir → PPN akan dijelaskan di sini.
- **Aturan earning Driver** (Level 5).
- **SLA pengiriman & simulasi hari berikutnya** (Level 6).
- **Catatan keamanan lengkap** (Level 7).
