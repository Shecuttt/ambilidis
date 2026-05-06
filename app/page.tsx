import { Button } from "@/components/ui/button";
import { ArrowRight, Store, ShoppingCart, Truck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";



export default async function LandingPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    profile = data;
  }

  const roles = Array.isArray(profile?.role) ? profile.role : [];
  const isSeller = roles.includes('seller');

  return (
    <>
      <Navbar />
      <div className="flex flex-col">
        {/* ── Hero Section ── */}
        <section className="relative min-h-[90vh] flex items-center pt-10 overflow-hidden">
          {/* Background blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-200/20 rounded-full blur-[120px]" />
          </div>

          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 text-center lg:text-left">

              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.2] md:leading-[1.1]">
                Kebutuhan Harian, <br />
                <span className="text-primary bg-clip-text">Dekat & Cepat.</span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Beli beras, telur, sayur, dan kebutuhan harian lainnya dari toko sembako terdekat. Dukung ekonomi tetangga, nikmati kemudahan antar.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 w-full">
                <Link href="/discovery" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                    Cari Toko Sekarang
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                {isSeller ? (
                  <Link href="/seller/dashboard" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-2xl border-2">
                      Dashboard Seller
                    </Button>
                  </Link>
                ) : (
                  <Link href="/seller/setup" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg rounded-2xl border-2">
                      Daftarkan Toko Anda
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-8 pt-8 border-t border-border">
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-foreground">50+</p>
                  <p className="text-sm text-muted-foreground">Toko Lokal</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-foreground">1000+</p>
                  <p className="text-sm text-muted-foreground">Produk Segar</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-foreground">15 Menit</p>
                  <p className="text-sm text-muted-foreground">Rata-rata Antar</p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-linear-to-tr from-primary/10 to-transparent rounded-[3rem] -rotate-3" />
              <div className="relative bg-card border shadow-2xl rounded-[3rem] p-8 space-y-6 rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                      <Store className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-bold">Toko Sembako Berkah</h4>
                      <p className="text-xs text-muted-foreground">Jarak: 200m dari lokasimu</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">BUKA</Badge>
                </div>

                <div className="space-y-3">
                  {[
                    { name: "Beras Cianjur 5kg", price: "Rp 75.000" },
                    { name: "Telur Ayam 1kg", price: "Rp 28.000" },
                    { name: "Minyak Goreng 2L", price: "Rp 34.000" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm font-bold text-accent">{item.price}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full h-12 rounded-xl" disabled>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Tambah ke Keranjang
                </Button>
              </div>

            </div>
          </div>
        </section>

        {/* ── Benefits Section ── */}
        <section className="py-12 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Belanja Lebih Pintar, Lebih Dekat</h2>
              <p className="text-muted-foreground italic">&quot;Ambilidis menghubungkan kamu dengan ekosistem lokal terbaik di lingkunganmu.&quot;</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Store className="h-8 w-8" />,
                  title: "Dukung Toko Lokal",
                  desc: "Setiap rupiah yang kamu belanjakan mengalir ke tetanggamu sendiri, membantu ekonomi lokal tetap berputar.",
                  color: "bg-primary/10 text-primary"
                },
                {
                  icon: <ShoppingCart className="h-8 w-8" />,
                  title: "Pesan Tanpa Antri",
                  desc: "Tak perlu lagi keluar rumah dan mengantri. Pesan semua kebutuhan lewat ponsel, semudah chatting.",
                  color: "bg-accent/10 text-accent"
                },
                {
                  icon: <Truck className="h-8 w-8" />,
                  title: "Pengantaran Kilat",
                  desc: "Karena toko hanya berjarak beberapa meter dari rumahmu, barang sampai lebih cepat dan lebih segar.",
                  color: "bg-primary/10 text-primary"
                }
              ].map((feature, i) => (
                <div key={i} className="p-8 rounded-3xl border border-border bg-card hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it Works ── */}
        <section className="py-12 md:py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2 space-y-6">
                <h2 className="text-4xl font-bold text-foreground">Mulai dalam Hitungan Detik</h2>
                <div className="space-y-8 pt-4">
                  {[
                    { step: "01", title: "Atur Lokasi", desc: "Berikan akses lokasi agar kami bisa mencarikan toko yang benar-benar ada di sekitarmu." },
                    { step: "02", title: "Pilih Toko & Barang", desc: "Lihat katalog harga terbaru dari toko sembako langganan atau cari yang termurah." },
                    { step: "03", title: "Bayar & Tunggu", desc: "Gunakan transfer bank atau COD. Kurir toko akan segera berangkat ke depan pintumu." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6">
                      <span className="text-3xl font-black text-primary/20">{item.step}</span>
                      <div>
                        <h4 className="text-lg font-bold text-foreground mb-1">{item.title}</h4>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="aspect-square bg-card rounded-full border-8 border-border flex items-center justify-center relative shadow-inner">
                  <Store className="h-32 w-32 text-primary opacity-20" />
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <p className="text-center text-muted-foreground font-medium">Visual Animasi Cara Kerja</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* ── CTA Final ── */}
        <section className="py-12 md:py-24 px-4">
          <div className="max-w-5xl mx-auto bg-primary rounded-[2rem] md:rounded-[3rem] p-8 sm:p-12 md:p-16 text-center text-white relative overflow-hidden shadow-2xl shadow-primary/40">
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
              <Store className="h-32 w-32 md:h-48 md:w-48 rotate-12" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold mb-4 md:mb-6 relative">Siap Belanja Tanpa Ribet?</h2>
            <p className="text-base sm:text-lg md:text-xl text-white/80 mb-8 md:mb-10 max-w-2xl mx-auto relative leading-relaxed">
              Gabung bersama ribuan warga lainnya yang sudah beralih ke cara belanja hyperlocal. Hemat waktu, dukung tetangga.
            </p>
            <Link href="/discovery" className="relative inline-block w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto h-12 sm:h-14 md:h-16 px-6 sm:px-10 md:px-12 text-lg md:text-xl rounded-2xl font-bold shadow-xl hover:scale-105 transition-all">
                Temukan Toko Terdekat
              </Button>
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
