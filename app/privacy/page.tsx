export const metadata = {
  title: "Kebijakan Privasi | ambilidis",
  description: "Kebijakan privasi dan pengelolaan data pengguna ambilidis.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-primary">Kebijakan Privasi</h1>
      <div className="prose prose-stone dark:prose-invert max-w-none space-y-6">
        <p className="text-muted-foreground">Pembaruan Terakhir: {new Date().toLocaleDateString('id-ID')}</p>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Pendahuluan</h2>
          <p>
            Di ambilidis, kami sangat menghargai privasi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi data pribadi Anda saat Anda menggunakan platform kami.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Data yang Kami Kumpulkan</h2>
          <p>Untuk memberikan pengalaman layanan yang optimal, kami dapat mengumpulkan informasi sensitif berikut:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li><strong>Data Profil:</strong> Nama, alamat email, dan nomor telepon seluler.</li>
            <li><strong>Data Lokasi:</strong> Lokasi Anda untuk menemukan penjual terdekat dan keperluan pengiriman.</li>
            <li><strong>Data Transaksi:</strong> Riwayat pesanan, metode pembayaran, dan aktivitas transaksi Anda di platform kami.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Penggunaan Data</h2>
          <p>Kami menggunakan data yang dikumpulkan untuk:</p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Memfasilitasi transaksi dan komunikasi antara Pembeli dan Penjual.</li>
            <li>Meningkatkan kualitas layanan dan keamanan platform.</li>
            <li>Mencegah aktivitas penipuan dan mematuhi kewajiban hukum.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Keamanan dan Perlindungan Data</h2>
          <p>
            Kami menerapkan standar keamanan industri untuk melindungi informasi Anda dari akses, perubahan, atau pengungkapan yang tidak sah. Data sensitif seperti kata sandi dienkripsi, dan kami menggunakan infrastruktur yang aman untuk menyimpan informasi Anda.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Berbagi Data kepada Pihak Ketiga</h2>
          <p>
            Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Namun, informasi tertentu mungkin dibagikan kepada Penjual (seperti detail pesanan dan nomor kontak) untuk menyelesaikan transaksi, atau kepada mitra pembayaran yang terpercaya.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Hak Pengguna</h2>
          <p>
            Anda memiliki hak untuk mengakses, memperbarui, atau menghapus data pribadi Anda dari sistem kami. Jika Anda memiliki pertanyaan atau kekhawatiran tentang kebijakan ini, Anda dapat menghubungi tim dukungan kami.
          </p>
        </section>
      </div>
    </div>
  );
}
