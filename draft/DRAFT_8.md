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