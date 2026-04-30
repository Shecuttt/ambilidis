# Draft 2: Persiapan Integrasi Lanjutan (Ambilidis)

## Konteks Proyek Saat Ini
Ambilidis adalah aplikasi *hyperlocal marketplace* yang mempertemukan *Buyer* dan *Seller* di sekitarnya. 
Pada tahap *MVP* (Draft.md), kita telah berhasil menyelesaikan *End-to-End Core Transaction Flow* yang meliputi:
- Pendaftaran toko dan produk oleh *Seller*.
- Pencarian toko oleh *Buyer* dan proses *Add to Cart* hingga *Checkout*.
- Sistem manajemen pesanan sederhana (*Pending -> Accepted -> In Delivery -> Completed*) di sisi *Seller* dan *Buyer* menggunakan **Client-Side Rendering (CSR)** Supabase.

Tugas di tahap Draft 2 ini adalah meningkatkan keandalan sistem dan menambahkan fitur-fitur vital.

---

## Sasaran Utama (Draft 2)

### 1. Migrasi Auth dari Client-Side ke Server-Side Rendering (SSR)
Saat ini proyek masih mengandalkan inisialisasi `@supabase/supabase-js` biasa di *client component*. 
Tugas:
- Aktifkan fitur **SSR** menggunakan `@supabase/ssr`.
- Gunakan kode di dalam folder `utils/supabase/` (`server.ts`, `client.ts`, `middleware.ts`) secara penuh.
- Implementasikan `middleware.ts` untuk melindungi rute halaman secara *Server-Side* (contoh: cegah *Buyer* masuk ke `/seller/dashboard`, wajib *login* untuk checkout).

### 2. Integrasi Payment Gateway (Midtrans)
Pembayaran saat ini masih berupa pilihan *dummy* (COD/Transfer).
Tugas:
- Integrasikan *Midtrans Snap* untuk menangani pembayaran secara otomatis.
- Catat status pembayaran dari Midtrans (contoh: *unpaid*, *paid*) ke tabel *database*.

### 3. Integrasi Notifikasi WhatsApp (Fonnte)
Notifikasi masuk ke *Seller* atau *Buyer* harus bisa dilakukan via WhatsApp.
Tugas:
- Gunakan API *Fonnte* untuk mengirimkan notifikasi. 
- Kirim pesan ke *Seller* saat ada order masuk, dan ke *Buyer* saat order telah diterima oleh toko atau dikirim.

---

> Semua file SQL lama dan baru (termasuk `supabase_schema.sql`) sekarang sudah dikumpulkan rapi di dalam direktori `sql/`.
