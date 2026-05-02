# DRAFT 4: SSR Implementation & Landing Page Refactoring

Tahap ini berfokus pada transisi dari Client-Side Rendering (CSR) murni ke Server-Side Rendering (SSR) untuk meningkatkan SEO dan performa, serta memperbaiki struktur navigasi aplikasi Ambilidis.

## 1. Landing Page & Server Components (`app/page.tsx`)
- [x] Ubah `app/page.tsx` menjadi **Server Component** (hilangkan `"use client"`).
- [x] Desain ulang sebagai **Landing Page Modern**:
    - Hero Section: Judul yang kuat, deskripsi, dan tombol CTA "Cari Toko Terdekat".
    - Benefit Section: Kenapa belanja di Ambilidis (Cepat, Segar, Tetangga Sendiri).
    - How it Works: Langkah mudah pesan - antar.
- [x] Implementasi SEO (Meta Tags) di level server.

## 2. Discovery Page (`app/discovery/page.tsx`)
- [x] Pindahkan logic `app/page.tsx` lama (list toko, geolocation, search) ke halaman baru `/discovery`.
- [x] Pastikan transisi dari Landing Page ke Discovery terasa mulus.

## 3. Reusable Navigation & Footer
- [x] Ekstraksi Header ke `components/layout/Navbar.tsx`:
    - Responsif: Berbeda tampilan untuk Mobile dan Desktop.
    - Integrasi Keranjang: Tetap menampilkan jumlah item.
    - Gunakan pola Client Component hanya pada elemen yang membutuhkan (misalnya cart count).
- [x] Buat `components/layout/Footer.tsx`:
    - Link navigasi cepat, Hak Cipta, dan link Seller Dashboard.
- [x] Pasang Navbar & Footer di `app/layout.tsx` atau layout spesifik.

## 4. Jangkauan Layanan (Distance Constraint)
- [x] Tetapkan konstanta `MAX_SERVICE_DISTANCE = 10` (dalam KM).
- [x] Filter daftar toko di `/discovery` agar hanya menampilkan toko dalam jangkauan.
- [x] Implementasi **Empty State** khusus jika lokasi sudah diset tapi tidak ada toko dalam radius 10 KM.

## 5. Optimasi SSR (Optional but Recommended)
- [ ] Gunakan `@supabase/ssr` untuk fetch data toko populer di Landing Page langsung dari server.
- [ ] Gunakan `Suspense` untuk loading state yang lebih granular.

---
**Catatan Penting:**
Penerapan Server Component pada `app/page.tsx` akan membuat halaman awal dimuat secara instan oleh browser tanpa menunggu JavaScript bundle yang besar, sangat krusial untuk SEO marketplace.
