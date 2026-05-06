import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from '@vercel/analytics/next';

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
  description: "Hyperlocal marketplace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      .single();
    
    if (profile) {
      userWithProfile = { ...user, ...profile };
    }
  }

  return (
    <html
      lang="id"
      className={`${jakartaSans.className} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <AuthProvider initialUser={userWithProfile}>
          <TooltipProvider>
            <main className="flex-1">
              {children}
            </main>
            <LegalReagreementOverlay />
          </TooltipProvider>
        </AuthProvider>
        {/* Sonner toast notifications — dipakai di seluruh app */}
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  );
}
