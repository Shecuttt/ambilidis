# DRAFT 7: Optimizing UI/UX & Auth Seller & Buyer

## 1. Perbaikan Error Upload Produk
- Error: 401 Unauthorized saat upload gambar produk.
- Solusi: 
    - Periksa dan perbarui Supabase Storage policy untuk bucket `products`.
    - Pastikan authenticated user memiliki hak akses `storage.object.insert`.

## 2. Perbaikan UX Input Lokasi
- Masalah: Input manual koordinat kurang user-friendly.
- Solusi: 
    - Ganti input lat/lng dengan search box location menggunakan Nominatim API.
    - Tambahkan autocomplete suggestion untuk nama lokasi.
    - Berlaku untuk onboarding buyer maupun setup toko seller.

## 3. Penerapan Loading State di Semua Halaman
- Halaman yang terpengaruh: Semua halaman buyer (discovery, toko, checkout, order tracking) dan semua halaman seller (dashboard, produk, order).
- Implementasi:
    - Loading state saat fetch data.
    - Loading state saat submit form (insert, update, delete).
    - Loading state saat user klik button yang memicu redirect.
    - Toast notifikasi (sukses/error).

## 4. Toast After Login
- Menampilkan nama lengkap (`full_name`) user setelah berhasil login.

## 5. Role Seller & Buyer
- Context: Sistem punya dua entry point login yang berbeda, role ditentukan dari mana user masuk, bukan dari pilihan di form.
- Yang perlu diimplementasi:
    1. Route `/seller/login` — setelah signup/login berhasil, set role = 'seller' di tabel profiles (dari tombol "jadi seller" di Navbar.tsx).
    2. Route `/login` (buyer) — setelah signup/login berhasil, set role = 'buyer' di tabel profiles (dari tombol checkout saat belum login).
    3. Redirect setelah login:
        - Seller → `/seller/dashboard`
        - Buyer → kembali ke halaman sebelumnya (biasanya checkout atau detail toko).
- Constraint: User dengan role seller tetap bisa melakukan order layaknya buyer — jangan restrict insert ke tabel orders berdasarkan role. Form login kedua route ini tampilannya sama, yang beda hanya logic setelah auth berhasil.

## 6. Checkout Guest User
- Context: Cart tidak punya halaman atau tabel tersendiri. Isi cart disimpan di Zustand state. Masalah: state hilang saat user diredirect ke login.
- Yang perlu diimplementasi:
    1. Pakai zustand/middleware — persist — agar cart state otomatis tersimpan ke localStorage.
    2. Setelah login berhasil, redirect ke `/checkout` langsung.
- Constraint: Zustand akan otomatis rehydrate dari localStorage saat halaman checkout dimuat. Jangan clear cart dari localStorage saat redirect ke login, hanya clear setelah order berhasil dibuat.

## 7. Penyimpanan lokasi user & alamat pengiriman

**Context:**
*Tabel `profiles` belum punya kolom address dan location. Saat ini buyer harus input alamat setiap checkout. Lokasi yang diset di discovery juga belum tersimpan ke DB.*

**Yang perlu diimplementasi:**
1. *Tambah kolom `address` (TEXT) dan `location` (GEOGRAPHY(POINT, 4326)) di tabel `profiles`*
2. *Saat user set lokasi di discovery atau checkout (via Nominatim), simpan hasilnya ke `profiles.address` dan `profiles.location` — berlaku untuk semua role*
3. *Saat buka checkout, auto-fill alamat dari `profiles.address` kalau sudah tersimpan. Tampilkan location search component untuk edit jika perlu*
4. *Tambahkan location search component di halaman checkout (sama seperti di discovery dan setting toko seller)*
5. *Tambahkan link untuk kembali ke toko di ringkasan pesanan checkout, mengarah ke halaman toko yang sedang dipesan berupa link kembali dan nama toko tersebut*

**Constraint:**
*User yang sudah pernah set lokasi tidak perlu input ulang — lokasi tersimpan permanen di `profiles` dan bisa diupdate kapan saja*

## 8. Onboarding toko seller

*Context:*
*Saat ini setiap seller baru otomatis mendapat toko dengan nama "Toko Baru" saat pertama kali akses dashboard, meskipun belum siap berjualan.*

*Yang perlu diimplementasi:*
1. *Hapus logic auto-create toko di dashboard*
2. *Seller yang belum punya toko diarahkan ke halaman setup toko — wajib isi nama toko dan lokasi (via Nominatim) sebelum toko terbentuk di DB*
3. *Setelah submit → toko dibuat → redirect ke dashboard*
4. *Toko baru dibuat dengan `is_open = false` secara default*

*Constraint:*
*Toko dengan `is_open = false` tidak muncul di discovery buyer*

## 9. Role sebagai array

*Context:*
*Role saat ini disimpan sebagai single value TEXT. Perlu diubah ke array agar satu user bisa punya kapabilitas buyer dan seller sekaligus.*

*Yang perlu diimplementasi:*
1. *Ubah kolom `role` di tabel `profiles` dari `TEXT` ke `TEXT[]`*
2. *Update default value saat signup:*
   - *Via `/seller/login` → `['seller', 'buyer']`*
   - *Via `/login` → `['buyer']`*
3. *Update semua RLS policy yang cek role — dari `role = 'seller'` ke `'seller' = ANY(role)`*
4. *Update routing guard — cek `role` array mengandung `'seller'` untuk akses dashboard seller*
5. *Jika buyer membuka toko → append `'seller'` ke array tanpa menghapus `'buyer'`*
6. *Ganti tombol "Dashboard seller" menjadi "Buka Toko" di `Navbar.tsx` buyer. Saat tombol "Buka Toko" diklik, append `'seller'` ke role array user tersebut, lalu redirect ke halaman setup toko*

*Constraint:*
*`'buyer'` tidak pernah dihapus dari array — sekali terdaftar, user selalu bisa belanja*