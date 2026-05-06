import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex items-center justify-center min-h-[70vh] px-4 py-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 -z-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-200/10 rounded-full blur-[100px]" />
        </div>

        <div className="text-center space-y-8 max-w-2xl mx-auto">
          {/* Visual 404 */}
          <div className="relative inline-block">
            <h1 className="text-[10rem] sm:text-[12rem] font-black text-primary/10 select-none leading-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-background/80 backdrop-blur-sm p-6 rounded-3xl border border-border shadow-2xl">
                <Search className="h-16 w-16 text-primary animate-pulse" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">Waduh, Halamannya Hilang!</h2>
            <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
              Sepertinya alamat yang kamu cari tidak ada atau sudah dipindahkan. Jangan khawatir, yuk balik ke jalan yang benar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-12 px-8 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 font-bold">
                <Home className="mr-2 h-5 w-5" />
                Kembali ke Beranda
              </Button>
            </Link>
            <Link href="/discovery" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 rounded-2xl border-2 font-bold hover:bg-muted/50 transition-all">
                Cari Toko Terdekat
              </Button>
            </Link>
          </div>

          <div className="pt-8">
            <Link 
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2 group"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
