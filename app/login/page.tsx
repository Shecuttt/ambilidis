import { AuthForm } from "@/components/auth/AuthForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk ke Ambilidis",
  description: "Masuk atau daftar akun Ambilidis untuk mulai berbelanja produk segar langsung dari petani.",
};

export default function BuyerLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }>
        <AuthForm type="buyer" />
      </Suspense>
    </div>
  );
}
