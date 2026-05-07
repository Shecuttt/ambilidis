# DRAFT 8 - Menerapkan legalitas pada aplikasi 

## 1. Membuat halaman terms and conditions dan privacy policy

*Context:* aplikasi belum memiliki halaman legalitas 

*Yang wajib ada:*

1. Syarat & Ketentuan — mencakup hak dan kewajiban seller, buyer, dan platform. Termasuk kebijakan refund dan komisi
2. Kebijakan Privasi — karena lo nyimpan data lokasi, nomor HP, dan riwayat transaksi user. Ini sensitif dan ada implikasi hukum

*Implementasi yang paling simpel:*

1. Halaman statis `/terms` dan `/privacy`
2. Checkbox "Saya setuju dengan Syarat & Ketentuan" saat signup — wajib dicentang sebelum bisa lanjut
3. Simpan timestamp kapan user setuju di tabel `profiles` — kolom `agreed_at`

*Constraint:*
*Timestamp `agreed_at` dihapus saat user melakukan reset password atau perubahan data lainnya — user wajib setuju ulang jika ada perubahan signifikan di masa mendatang.*

## 2. Cart State untuk Guest User
*Context:* Ketika user guest melihat detail toko, masih ada state cart yang tertinggal. Seharusnya jika guest melihat detail toko setelah menutup aplikasi, state keranjang kosong. Jadi tidak ada ceritanya state cart terisi saat re-open aplikasi. Kecuali jika user tersebut login, baru bisa state cart nya disimpan sementara.

*Implementasi:* cek kondisi sebelum persist — kalau user tidak login, jangan aktifkan persist middleware-nya. Atau solusi yang lebih simpel: saat app pertama kali load dan user statusnya guest, langsung clear cart dari localStorage.

## 3. Resi Order
*Context:*
*Buyer butuh bukti transaksi, seller butuh dokumentasi order untuk ditempel ke paket sebelum diserahkan ke kurir.*

*Yang perlu diimplementasi:*
1. *Halaman `/order/[id]` — accessible dari riwayat order buyer dan dashboard seller. Menampilkan: nomor order, detail item + kuantitas, total harga, status order, dan timestamp tiap perubahan status*
2. *Halaman `/order/[id]/print` — layout bersih tanpa navbar/sidebar, dioptimalkan untuk print atau screenshot seller. Isinya: nomor order, nama & alamat buyer, nomor HP buyer, list item + kuantitas, nama toko seller*

*Constraint:*
*Halaman print hanya accessible oleh seller pemilik order tersebut*