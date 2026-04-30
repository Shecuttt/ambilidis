# Rencana Pengembangan Ambilidis - DRAFT 3 (COMPLETED)

Fokus Utama: **Optimalisasi Dashboard Seller & Location-first Buyer Discovery.**

### 1. Dashboard & Pengaturan Toko (Seller)
Tujuan: Memberikan kontrol lebih kepada seller terhadap operasional harian.
- [x] **Update Tagline Hari Ini**: Seller bisa mengubah sapaan atau info stok harian yang muncul di halaman toko mereka (misal: "Hari ini ready ikan segar baru datang!").
- [x] **Alasan Penolakan Order**: Menambahkan *field* input alasan saat seller menolak pesanan (`rejected`), agar pembeli mendapat kejelasan.
- [x] **Manajemen Stok Cepat**: Tombol *toggle* cepat di daftar produk untuk menandai produk "Habis" atau "Tersedia" tanpa harus masuk ke menu edit.

### 2. Location-first Discovery (Buyer)
Tujuan: Memastikan pembeli melihat toko yang paling relevan (paling dekat) terlebih dahulu.
- [x] **Onboarding Lokasi**: Saat pertama kali buka, aplikasi meminta izin akses lokasi (GPS) atau input lokasi manual.
- [x] **Store Sorting by Distance**: Daftar toko diurutkan secara otomatis berdasarkan jarak terdekat dari posisi pembeli.
- [x] **Distance Badge**: Menampilkan estimasi jarak (misal: "0.8 km") pada kartu toko di halaman utama.

### 3. Discovery & Belanja (Buyer)
Tujuan: Memperkaya pengalaman visual dan kemudahan navigasi produk.
- [x] **Store Detail Header**: Mengubah header halaman toko menjadi lebih *cinematic* dengan foto toko yang lebih besar dan informasi alamat yang jelas.
- [x] **Unavailable Products**: Produk yang ditandai habis oleh seller tetap muncul tapi dalam kondisi *dimmed* (redup) dan tidak bisa diklik/dimasukkan keranjang.
- [x] **Detail Produk (Inline Controls)**: (Update: Bottom Sheet dihapus demi efisiensi) Interaksi produk sekarang dilakukan langsung pada baris produk dengan *quantity selector* yang responsif.

### 4. Keranjang & Checkout (Buyer)
Tujuan: Menjaga alur logistik tetap sederhana dengan keranjang eksklusif.
- [x] **Validasi 1 Toko 1 Keranjang**: Sistem memberikan dialog konfirmasi jika pembeli mencoba memasukkan produk dari toko 'B' ketika sudah ada produk dari toko 'A' di keranjangnya.
- [x] **Catatan untuk Seller**: Menambahkan *field* input opsional (max 200 karakter) saat *checkout*.
- [x] **Ongkos Kirim Manual**: Perhitungan ongkir transparan berbasis jarak (Rp 2.000/km) dengan info kalkulasi yang jelas: "X.X km × Rp 2.000 = Rp Y.YYY".

### 5. Post-Delivery & Ulasan
Tujuan: Membangun reputasi toko melalui penilaian langsung.
- [x] **Prompt Rating Singkat**: Setelah pesanan dikonfirmasi selesai (`completed`), muncul *pop-up* cepat untuk memberikan bintang (1-5) dan opsi keluhan instan (basi / salah item / kurang berat).

---
*Status: Seluruh fitur Phase 3 telah diimplementasikan dan siap untuk pengujian internal.*
