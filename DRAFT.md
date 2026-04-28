## Core Transaction Flow — Yang Harus Lo Build
**Seller punya toko → Buyer nemu toko → Buyer order → Seller konfirmasi → Kurir jemput → Barang tiba**

### Sisi Seller (minimal banget)
- Setup toko: nama, foto, lokasi, jam buka
- Tambah produk: nama, foto, harga, satuan, status ada/habis
- Toggle buka/tutup toko hari ini
- Terima notifikasi order masuk
- Konfirmasi atau tolak order (dengan countdown 15 menit)

### Sisi Buyer (minimal banget)
- Set lokasi
- Lihat toko terdekat yang lagi buka
- Masuk toko, lihat produk
- Add to cart, checkout, bayar
- Tracking status order

### Platform (minimal banget)
- Koordinasi status order antara seller, kurir (GoSend), dan buyer
- Payment masuk, komisi lo terpotong otomatis, sisanya ke seller
