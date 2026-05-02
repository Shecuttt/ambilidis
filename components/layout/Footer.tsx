import { Store } from "lucide-react";
import { siInstagram, siX, siFacebook } from "simple-icons";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-white border-t py-12">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary">
              ambilidis
            </span>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Pasar hyperlocal yang menghubungkan kamu dengan toko sembako dan kebutuhan harian terbaik di sekitarmu.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <a href="#" className="hover:text-primary transition-colors">
              <svg role="img" viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <title>{siInstagram.title}</title>
                <path d={siInstagram.path} />
              </svg>
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              <svg role="img" viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <title>{siX.title}</title>
                <path d={siX.path} />
              </svg>
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              <svg role="img" viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                <title>{siFacebook.title}</title>
                <path d={siFacebook.path} />
              </svg>
            </a>
          </div>
        </div>

        {/* Links - Belanja */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Belanja</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/discovery" className="hover:text-primary transition-colors">Cari Toko</Link></li>
            <li><Link href="/orders" className="hover:text-primary transition-colors">Pesanan Saya</Link></li>
            <li><Link href="/checkout" className="hover:text-primary transition-colors">Keranjang</Link></li>
          </ul>
        </div>

        {/* Links - Seller */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Untuk Seller</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/login" className="hover:text-primary transition-colors">Daftar Toko</Link></li>
            <li><Link href="/seller/dashboard" className="hover:text-primary transition-colors">Dashboard Seller</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Pusat Bantuan</Link></li>
          </ul>
        </div>

        {/* Links - Legal */}
        <div>
          <h4 className="font-bold text-gray-900 mb-4">Lainnya</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Hubungi Kami</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Ambilidis. Dibuat dengan ❤️ untuk tetangga.
        </p>
        <div className="flex gap-6 text-xs text-gray-400 uppercase tracking-widest font-bold">
          <span>Fresh</span>
          <span>Local</span>
          <span>Fast</span>
        </div>
      </div>
    </footer>
  );
}
