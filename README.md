# Ambilidis

Ambilidis adalah platform marketplace modern.

---

## 🛠️ Tech Stack
* **Framework**: Next.js (React 19)
* **Database & Auth**: Supabase (PostgreSQL, GoTrue)
* **Local Development**: Docker Engine & Supabase CLI
* **Package Manager**: pnpm

---

## 🚀 Prasyarat Sebelum Memulai
Pastikan Anda sudah menginstal tool berikut di mesin lokal Anda:
1. **Node.js** (versi 18+) & **pnpm** (`npm install -g pnpm`)
2. **Docker Engine / Docker Desktop** (harus dalam keadaan aktif/running)

---

## 📦 Setup Pengembangan Lokal

### 1. Klon & Instalasi Dependensi
```bash
# Clone repositori dan masuk ke direktori
cd ambilidis

# Instal dependensi lokal
pnpm install
```

### 2. Konfigurasi Environment Variables
Salin file template `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Secara default, file ini dikonfigurasi untuk terhubung ke instance Supabase lokal yang berjalan di Docker (`http://127.0.0.1:54321`).

### 3. Menjalankan Database Supabase Lokal (Docker)
Supabase CLI diatur secara lokal di proyek ini untuk mengelola database di dalam kontainer Docker.

* **Menyalakan Database**:
  ```bash
  pnpm exec supabase start
  ```
  *(Perintah ini akan menyalakan semua container Supabase dan otomatis menerapkan file migrasi schema terbaru).*

* **Mematikan Database** (jika selesai bekerja):
  ```bash
  pnpm exec supabase stop
  ```

* **Reset Database** (menghapus data lama dan menerapkan ulang schema awal):
  ```bash
  pnpm exec supabase db reset
  ```

---

## 🖥️ Menjalankan Aplikasi Web (Next.js)

Setelah database lokal aktif dan menyala, jalankan server pengembangan Next.js:
```bash
pnpm dev
```
Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat aplikasi.

---

## 🔍 Development Dashboard Lokal
Ketika local Supabase sedang menyala, Anda dapat mengakses dashboard pendukung berikut:
* **Supabase Studio (Database GUI)**: [http://localhost:54323](http://localhost:54323) — untuk melihat tabel data, authentikasi user, dan logs.
* **Mailpit (In-box email lokal)**: [http://localhost:54324](http://localhost:54324) — untuk memantau email authentikasi (signup/reset password) yang dikirim oleh sistem lokal.