# DRAFT 6: SSR Optimization & Authentication Security

Tahap ini fokus pada pengoptimalan penanganan sesi antara server dan browser, serta peningkatan keamanan cookie autentikasi.

---

## Poin 1 — Optimalisasi SSR & Keamanan Cookie (httpOnly)

### Arsitektur yang Diusulkan:
1.  **Session Provider (Server-to-Client)**: 
    - Data user diambil di `app/layout.tsx` (Server Component) menggunakan `supabase.auth.getUser()`.
    - Data ini dikirim ke `AuthProvider` (Client Component) yang membungkus aplikasi.
    - Menghilangkan "flicker" UI dan ketergantungan client-side pada pembacaan cookie langsung.
2.  **Manajemen Refresh Token**:
    - Refresh token ditangani sepenuhnya oleh `proxy.ts` (Middleware) di sisi server.
    - Setiap request akan memicu pengecekan/refresh otomatis via `@supabase/ssr`.
    - Sinkronisasi state di browser tetap terjaga melalui event listener `onAuthStateChange` di dalam Provider.
3.  **Keamanan Berlapis**:
    - Mengaktifkan kembali `httpOnly: true` di `utils/supabase/middleware.ts` untuk memproteksi cookie dari serangan XSS.

### Langkah Eksekusi:
- [ ] Buat `components/providers/AuthProvider.tsx` untuk mengelola global auth state.
- [ ] Update `app/layout.tsx` untuk mengambil user secara server-side dan membungkus children dengan `AuthProvider`.
- [ ] Update `utils/supabase/middleware.ts` untuk mengaktifkan `httpOnly: true`.
- [ ] Refaktor `components/layout/Navbar.tsx` untuk menggunakan context dari `AuthProvider`.

---

## Poin 2 — Refaktor Manajemen Produk

### Rencana:
1.  **Validasi Form dengan Zod**: 
    - Implementasi `zod` dan `react-hook-form` di `AddProductDialog.tsx`.
    - Skema validasi mencakup: nama (min 3), harga (min 100), unit (non-empty), dan deskripsi.
2.  **Field Deskripsi Produk**:
    - Menambahkan input `textarea` untuk kolom `description` di database yang saat ini mungkin masih kosong atau belum terpakai di UI.
3.  **Manajemen Hapus Produk**:
    - Tambahkan konfirmasi `AlertDialog` sebelum menghapus produk untuk mencegah kehilangan data secara tidak sengaja.
4.  **Upload Foto (Storage)**:
    - Integrasi Supabase Storage untuk field `photo_url`.

---

## Poin 3 — Pengoptimalan Manajemen Pesanan (Seller)

### Rencana:
1.  **Bulk Accept Orders**:
    - Implementasi checkbox multi-select pada daftar pesanan seller.
    - Tombol aksi massal: "Terima Pesanan Terpilih" untuk memproses banyak order sekaligus ke status `accepted`.
2.  **Visual Grouping by Date**:
    - Mengelompokkan daftar pesanan berdasarkan hari (Today, Yesterday, Specific Date) menggunakan utilitas `date-fns` atau `Intl.DateTimeFormat`.
3.  **Status Filtering**:
    - UI Filter yang persisten (Tab atau Select) untuk memfilter pesanan berdasarkan status: `pending`, `accepted`, `in_delivery`, `completed`.

---

## Poin 4 — Peningkatan Pengaturan Toko

### Rencana:
1.  **Upload Logo & Banner**: Integrasi Storage untuk branding toko.
2.  **Peta Lokasi**: Input koordinat yang lebih presisi untuk akurasi radius 10km.

---

## Checklist Rencana
- [x] Riset & Test implementasi `httpOnly: true` dengan pola Session Provider.
- [x] Refaktor `Navbar` untuk mengambil data user dari Provider.
- [x] Implementasi Zod & Deskripsi di `AddProductDialog`.
- [x] Tambahkan konfirmasi hapus produk di `ProductTable`.
- [x] Implementasi Grouping & Filtering di `OrdersPageClient` (Seller).
- [x] Implementasi Bulk Accept di `OrdersPageClient` (Seller).
- [x] Integrasi Supabase Storage untuk foto produk/toko.
