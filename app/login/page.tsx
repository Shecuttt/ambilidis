"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const authSchema = z.object({
  email: z.email({ message: "Email tidak valid." }),
  password: z.string().min(6, { message: "Password minimal 6 karakter." }),
  fullName: z.string().optional(), // Used for sign up only
});

type AuthFormValues = z.infer<typeof authSchema>;

export default function BuyerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  const onSubmit = async (data: AuthFormValues) => {
    setIsLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        if (!data.fullName) {
          setErrorMsg("Nama lengkap wajib diisi untuk daftar.");
          setIsLoading(false);
          return;
        }

        if (!agreeTerms) {
          setErrorMsg("Anda wajib menyetujui Syarat & Ketentuan dan Kebijakan Privasi.");
          setIsLoading(false);
          return;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              role: "buyer",
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // Attempt to update agreed_at in profiles directly
          await supabase
            .from('profiles')
            .update({ agreed_at: new Date().toISOString() })
            .eq('id', authData.user.id);
        }

        toast.success("Pendaftaran berhasil! Silakan login.");
        setIsSignUp(false);
        reset();
      } else {
        const { error: signInError, data: authData } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) throw signInError;

        // Update role in profiles table
        if (authData.user) {
          // Fetch current profile to avoid overwriting roles array if user is also a seller
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user.id)
            .single();

          const currentRoles = Array.isArray(profile?.role) ? profile.role : [];
          if (!currentRoles.includes('buyer')) {
            const newRoles = [...currentRoles, 'buyer'];
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: authData.user.id,
                role: newRoles,
              });

            if (profileError) throw profileError;
          }
        }

        // Show welcome toast with user's full name
        const userMetadata = authData.user?.user_metadata || {};
        const fullName = userMetadata.full_name || authData.user?.email?.split('@')[0] || data.email;
        console.log('User metadata:', userMetadata, 'Full name:', fullName);
        toast.success(`Selamat datang, ${fullName}!`);

        // Get redirect URL from search params or default to home
        const redirectTo = searchParams.get('redirect') || '/';

        // Redirect to previous page or home
        router.push(redirectTo);
        router.refresh();
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setErrorMsg(error.message || "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border bg-card">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShoppingBag className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-primary">
            ambilidis
          </CardTitle>
          <CardDescription>
            {isSignUp ? "Buat akun baru untuk mulai berbelanja." : "Masuk ke akun Anda."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>
            )}


            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Error message — shadcn Alert */}
            {errorMsg && (
              <Alert variant="destructive">
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {isSignUp && (
              <div className="flex items-center space-x-2 pb-2">
                <Checkbox
                  id="agreeTerms"
                  checked={agreeTerms}
                  onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                  className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-[13px] text-muted-foreground leading-tight cursor-pointer select-none"
                >
                  Saya setuju dengan{" "}
                  <Link href="/terms" className="text-primary font-medium hover:underline" target="_blank">
                    Syarat & Ketentuan
                  </Link>{" "}
                  dan{" "}
                  <Link href="/privacy" className="text-primary font-medium hover:underline" target="_blank">
                    Kebijakan Privasi
                  </Link>
                  .
                </label>
              </div>
            )}

            <Button className="w-full font-semibold" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : isSignUp ? (
                "Daftar Sekarang"
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {/* Separator — shadcn Separator */}
          <div className="relative w-full">
            <Separator />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground uppercase">
              Atau
            </span>
          </div>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
              setAgreeTerms(false);
              reset();
            }}
          >
            {isSignUp ? "Sudah punya akun? Masuk" : "Belum punya akun? Daftar"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
