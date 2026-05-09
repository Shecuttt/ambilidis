"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const authSchema = z.object({
  email: z.string().email({ message: "Email tidak valid." }),
  password: z.string().min(6, { message: "Password minimal 6 karakter." }),
  fullName: z.string().min(2, { message: "Nama lengkap minimal 2 karakter." }).optional().or(z.literal("")),
  phone: z.string().regex(/^[0-9]{8,15}$/, { message: "Nomor HP tidak valid. Masukkan angka saja (contoh: 812...)" }).optional().or(z.literal("")),
});

type AuthFormValues = z.infer<typeof authSchema>;

interface AuthFormProps {
  type: "buyer" | "seller";
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      phone: "",
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

        if (!data.phone) {
          setErrorMsg("Nomor HP wajib diisi untuk daftar.");
          setIsLoading(false);
          return;
        }

        if (!agreeTerms) {
          setErrorMsg("Anda wajib menyetujui Syarat & Ketentuan.");
          setIsLoading(false);
          return;
        }

        // Format phone to E.164 (Indonesia +62)
        let formattedPhone = data.phone;
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+62" + formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+62" + formattedPhone;
        }

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              phone: formattedPhone,
              role: type === "seller" ? ["buyer", "seller"] : ["buyer"],
            },
          },
        });

        if (signUpError) throw signUpError;

        if (authData.user) {
          // Update profile with phone and agreed_at
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              phone: formattedPhone,
              agreed_at: new Date().toISOString(),
              role: type === "seller" ? ["buyer", "seller"] : ["buyer"]
            })
            .eq("id", authData.user.id);

          if (profileError) {
            console.error("Profile update error:", profileError);
          }
        }

        toast.success("Pendaftaran berhasil! Silakan periksa email Anda (jika verifikasi aktif) atau masuk sekarang.");
        setIsSignUp(false);
        form.reset();
      } else {
        const { error: signInError, data: authData } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (signInError) throw signInError;

        // Ensure roles are correct in profile
        if (authData.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", authData.user.id)
            .single();

          const currentRoles = Array.isArray(profile?.role) ? profile.role : [];
          const requiredRoles = type === "seller" ? ["buyer", "seller"] : ["buyer"];
          const missingRoles = requiredRoles.filter(r => !currentRoles.includes(r));

          if (missingRoles.length > 0) {
            const newRoles = Array.from(new Set([...currentRoles, ...requiredRoles]));
            await supabase
              .from("profiles")
              .upsert({
                id: authData.user.id,
                role: newRoles,
              });
          }
        }

        const fullName = authData.user?.user_metadata?.full_name || authData.user?.email;
        toast.success(`Selamat datang kembali, ${fullName}!`);

        let redirectTo = searchParams.get("redirect") || (type === "seller" ? "/seller/dashboard" : "/");
        
        // Prevent redirecting back to login pages
        if (redirectTo === "/login" || redirectTo === "/seller/login") {
          redirectTo = type === "seller" ? "/seller/dashboard" : "/";
        }
        
        console.log("Login sukses, mengalihkan ke:", redirectTo);
        
        // Hentikan loading sebelum navigasi agar UI tidak terasa stuck
        setIsLoading(false);

        // Memberikan jeda sangat singkat untuk memastikan cookie sesi sudah tertulis di browser
        // dan melakukan refresh router untuk memperbarui state server
        router.refresh();
        setTimeout(() => {
          window.location.href = redirectTo;
        }, 100);
        return;
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      let message = error.message || "Terjadi kesalahan.";
      
      // Map common Supabase auth errors to friendly Indonesian messages
      if (message.includes("Invalid login credentials")) {
        message = "Email atau password salah. Silakan periksa kembali data Anda.";
      } else if (message.includes("Email not confirmed")) {
        message = "Email Anda belum dikonfirmasi. Silakan periksa kotak masuk email Anda untuk verifikasi.";
      } else if (message.includes("User already registered")) {
        message = "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
      } else if (message.includes("rate limit") || message.includes("Rate limit")) {
        message = "Terlalu banyak percobaan masuk. Silakan tunggu beberapa menit sebelum mencoba lagi.";
      } else if (message.includes("User not found")) {
        message = "Akun tidak ditemukan. Silakan daftar terlebih dahulu.";
      } else if (message.includes("Password should be")) {
        message = "Password tidak memenuhi kriteria keamanan.";
      }

      setErrorMsg(message);
    } finally {
      setIsLoading(false);
    }
  };

  const isSeller = type === "seller";

  const config = {
    description: isSignUp
      ? (isSeller ? "Daftar untuk mulai berjualan dan kelola toko Anda" : "Buat akun untuk mulai berbelanja produk segar")
      : (isSeller ? "Masuk ke dashboard toko Anda" : "Masuk ke akun pembeli Anda"),
    submitText: isSignUp ? "Daftar Sekarang" : "Masuk",
    toggleText: isSignUp
      ? (isSeller ? "Sudah punya akun seller? Masuk" : "Sudah punya akun? Masuk")
      : (isSeller ? "Belum punya akun seller? Daftar" : "Belum punya akun? Daftar")
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-none bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-2 text-center pb-8">
        <div className="flex justify-center mb-2">
          <div className="p-2 animate-in zoom-in duration-500">
            <Image
              src="/icon.png"
              alt="Ambilidis Icon"
              width={80}
              height={80}
              className="size-16 object-contain"
            />
          </div>
        </div>
        <CardDescription className="text-base">
          {config.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup>
            {isSignUp && (
              <>
                <Controller
                  name="fullName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Nama Lengkap</FieldLabel>
                      <div className="relative group">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          className="pl-10 h-11 border-muted-foreground/20 focus:border-primary/50 transition-all"
                          placeholder="Masukkan nama lengkap"
                        />
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>Nomor HP</FieldLabel>
                      <div className="relative group flex">
                        <div className="flex items-center justify-center px-3 border border-r-0 border-muted-foreground/20 bg-muted/50 rounded-l-md text-sm font-semibold text-muted-foreground">
                          +62
                        </div>
                        <div className="relative flex-1 group">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                          <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            className="pl-10 h-11 rounded-l-none border-muted-foreground/20 focus:border-primary/50 transition-all"
                            placeholder="8123456789"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic px-1">
                        * Otomatis tersimpan dalam format internasional Indonesia (+62)
                      </p>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </>
            )}

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      {...field}
                      id={field.name}
                      type="email"
                      aria-invalid={fieldState.invalid}
                      className="pl-10 h-11 border-muted-foreground/20 focus:border-primary/50 transition-all"
                      placeholder="email@example.com"
                    />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      {...field}
                      id={field.name}
                      type={showPassword ? "text" : "password"}
                      aria-invalid={fieldState.invalid}
                      className="px-10 h-11 border-muted-foreground/20 focus:border-primary/50 transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>

          {errorMsg && (
            <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1 duration-300">
              <AlertDescription className="text-xs font-medium">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {isSignUp && (
            <Field orientation="horizontal" className="py-1">
              <Checkbox
                id="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
                className="mt-1 border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
              />
              <FieldLabel
                htmlFor="agreeTerms"
                className="text-xs text-muted-foreground leading-snug cursor-pointer select-none font-normal"
              >
                Saya menyetujui{" "}
                <Link href="/terms" className="text-primary font-bold hover:underline" target="_blank">
                  Syarat & Ketentuan
                </Link>{" "}
                serta{" "}
                <Link href="/privacy" className="text-primary font-bold hover:underline" target="_blank">
                  Kebijakan Privasi
                </Link>{" "}
                Ambilidis.
              </FieldLabel>
            </Field>
          )}

          <Button className="w-full h-11 text-base font-bold shadow-lg hover:shadow-primary/20 transition-all active:scale-[0.98]" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sedang memproses...
              </>
            ) : config.submitText}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-6 pb-8">
        <div className="relative w-full">
          <Separator className="bg-muted-foreground/10" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            ATAU
          </span>
        </div>
        <Button
          variant="ghost"
          className="w-full h-11 hover:bg-primary/5 hover:text-primary transition-all font-medium"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setErrorMsg("");
            setAgreeTerms(false);
            form.reset();
          }}
        >
          {config.toggleText}
        </Button>
      </CardFooter>
    </Card>
  );
}
