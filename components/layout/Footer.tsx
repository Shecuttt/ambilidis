import { siInstagram, siX, siFacebook } from "simple-icons";
import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-card border-t py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Ambilidis Logo"
              width={200}
              height={80}
              className="h-10 md:h-14 w-auto object-contain"
            />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs hidden md:block">
            Pasar hyperlocal yang menghubungkan kamu dengan toko sembako dan kebutuhan harian terbaik di sekitarmu.
          </p>
        </div>

        {/* Links - Belanja */}
        <div className="col-span-1">
          <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Belanja</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/discovery" className="hover:text-primary transition-colors">Cari Toko</Link></li>
            <li><Link href="/orders" className="hover:text-primary transition-colors">Pesanan Saya</Link></li>
            <li><Link href="/checkout" className="hover:text-primary transition-colors">Keranjang</Link></li>
          </ul>
        </div>

        {/* Links - Seller */}
        <div className="col-span-1">
          <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Seller</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/login" className="hover:text-primary transition-colors">Daftar Toko</Link></li>
            <li><Link href="/seller/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Pusat Bantuan</Link></li>
          </ul>
        </div>

        {/* Links - Legal */}
        <div className="col-span-2 md:col-span-1">
          <h4 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Bantuan</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/terms" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
            <li><Link href="/privacy" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
            <li><Link href="#" className="hover:text-primary transition-colors">Hubungi Kami</Link></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Ambilidis.
          </p>
          <div className="flex gap-4 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
            <span>Fresh</span>
            <span>Local</span>
            <span>Fast</span>
          </div>
        </div>

        <div className="flex items-center gap-5 text-muted-foreground/60">
          <a href="#" className="hover:text-primary transition-all hover:scale-110">
            <svg role="img" viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <title>{siInstagram.title}</title>
              <path d={siInstagram.path} />
            </svg>
          </a>
          <a href="#" className="hover:text-primary transition-all hover:scale-110">
            <svg role="img" viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <title>{siX.title}</title>
              <path d={siX.path} />
            </svg>
          </a>
          <a href="#" className="hover:text-primary transition-all hover:scale-110">
            <svg role="img" viewBox="0 0 24 24" className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg">
              <title>{siFacebook.title}</title>
              <path d={siFacebook.path} />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
