import { AuthForm } from "@/components/auth/AuthForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Login - Ambilidis",
  description: "Kelola toko Anda di Ambilidis. Masuk ke dashboard seller untuk memantau pesanan dan produk.",
};

export default function SellerLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <AuthForm type="seller" />
      </Suspense>
    </div>
  );
}
