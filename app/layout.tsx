import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next"

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LegalReagreementOverlay } from "@/components/LegalReagreementOverlay";

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ambilidis",
  description: "Your fresh products marketplace",
};

import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${jakartaSans.className} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={
          <TooltipProvider>
            <main className="flex-1 min-h-screen flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-4">
                <div className="h-10 w-10 bg-primary/10 rounded-full" />
                <div className="h-4 w-32 bg-muted rounded" />
              </div>
            </main>
          </TooltipProvider>
        }>
          <AuthWrapper>{children}</AuthWrapper>
        </Suspense>
        {/* Sonner toast notifications — dipakai di seluruh app */}
        <Toaster position="top-center" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

async function AuthWrapper({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch user data server-side
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, fetch their profile for role information
  let userWithProfile = user;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      userWithProfile = { ...user, ...profile };
    }
  }

  return (
    <AuthProvider initialUser={userWithProfile}>
      <TooltipProvider>
        <main className="flex-1">
          {children}
        </main>
        <LegalReagreementOverlay />
      </TooltipProvider>
    </AuthProvider>
  );
}
