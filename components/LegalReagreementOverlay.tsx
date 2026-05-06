"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, FileText, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

export function LegalReagreementOverlay() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isLegalPage = pathname === "/terms" || pathname === "/privacy";
  
  // Derived State: Hitung langsung apakah overlay harus muncul
  const isVisible = !authLoading && !!user && !user.agreed_at && !isLegalPage;

  if (!isVisible) return null;

  const handleAgree = async () => {
    if (!agreed) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/profile/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agreedAt: new Date().toISOString(),
          resetAgreement: false 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal memperbarui persetujuan');
      }

      toast.success("Terima kasih telah menyetujui Syarat & Ketentuan kami.");
      
      // Refresh to update the local user state
      router.refresh(); // Gunakan router.refresh() agar lebih halus, atau window.location.reload()
      
      // Berikan sedikit jeda sebelum memaksa reload jika router.refresh tidak cukup
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      console.error("Error updating agreement:", error);
      toast.error("Gagal memperbarui persetujuan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-md animate-in fade-in duration-500">
      <div className="w-full max-w-lg bg-card border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header Decor */}
        <div className="h-2 bg-linear-to-r from-primary via-amber-400 to-primary" />

        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Pembaruan Syarat & Ketentuan</h2>
              <p className="text-muted-foreground">
                Kami telah memperbarui kebijakan layanan kami untuk memberikan perlindungan dan transparansi yang lebih baik bagi seluruh pengguna Ambilidis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/terms"
              target="_blank"
              className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-none">Terms</p>
                <p className="text-[10px] text-muted-foreground mt-1 underline">Baca Selengkapnya</p>
              </div>
            </Link>

            <Link
              href="/privacy"
              target="_blank"
              className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="p-2 bg-amber-500/10 rounded-lg group-hover:scale-110 transition-transform">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-none">Privacy</p>
                <p className="text-[10px] text-muted-foreground mt-1 underline">Baca Selengkapnya</p>
              </div>
            </Link>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="re-agree"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked as boolean)}
                className="mt-1 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="re-agree"
                className="text-sm text-muted-foreground leading-relaxed cursor-pointer select-none"
              >
                Saya menyatakan telah membaca dan menyetujui seluruh isi dari <span className="text-foreground font-semibold">Syarat & Ketentuan</span> serta <span className="text-foreground font-semibold">Kebijakan Privasi</span> Ambilidis yang baru.
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 pt-0 mt-auto">
          <Button
            className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            disabled={!agreed || isSubmitting}
            onClick={handleAgree}
          >
            {isSubmitting ? (
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
            ) : (
              "Saya Setuju & Lanjutkan"
            )}
          </Button>
          <p className="text-[10px] text-center text-muted-foreground mt-4">
            Akses ke aplikasi akan dibatasi hingga Anda menyetujui kebijakan yang baru.
          </p>
        </div>
      </div>
    </div>
  );
}
