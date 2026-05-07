export const metadata = {
  title: "Syarat & Ketentuan | ambilidis",
  description: "Syarat dan ketentuan penggunaan platform ambilidis.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-primary">Syarat & Ketentuan</h1>
      <div className="prose prose-stone dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Pembaruan Terakhir: 8 Mei 2026</p>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Pendahuluan</h2>
          <p>
            Selamat datang di ambilidis. Dengan mengakses dan menggunakan platform kami, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan ketentuan apa pun, harap jangan gunakan platform kami.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Hak dan Kewajiban Pembeli</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Pembeli berhak menerima produk/layanan sesuai dengan deskripsi yang diberikan oleh Penjual.</li>
            <li>Pembeli wajib memberikan informasi kontak dan lokasi yang akurat untuk keperluan pesanan.</li>
            <li>Pembeli dilarang menggunakan platform untuk tujuan yang melanggar hukum.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Hak dan Kewajiban Penjual</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Penjual wajib menyediakan produk/layanan yang sesuai dengan standar dan deskripsi.</li>
            <li>Penjual wajib mengelola pesanan dengan profesional dan tepat waktu.</li>
            <li>Penjual berhak mendapatkan pembayaran atas transaksi yang berhasil.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Hak dan Kewajiban Platform</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Platform ambilidis berfungsi sebagai perantara antara Pembeli dan Penjual.</li>
            <li>Kami berhak menangguhkan atau menghapus akun pengguna yang melanggar ketentuan.</li>
            <li>Kami berhak menyesuaikan biaya layanan dan komisi sesuai dengan kebijakan yang berlaku.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Kebijakan Refund dan Komisi</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Permintaan refund dapat diajukan sesuai dengan kebijakan pengembalian masing-masing Penjual dan akan difasilitasi oleh platform jika memenuhi syarat.</li>
            <li>Komisi platform akan dipotong secara otomatis dari setiap transaksi yang berhasil sesuai dengan persentase yang disepakati.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Perubahan Syarat dan Ketentuan</h2>
          <p>
            Kami berhak mengubah syarat dan ketentuan ini kapan saja. Kami akan memberitahu pengguna tentang perubahan signifikan. Penggunaan berkelanjutan Anda atas platform menandakan persetujuan Anda terhadap perubahan tersebut.
          </p>
        </section>
      </div>
    </div>
  );
}
