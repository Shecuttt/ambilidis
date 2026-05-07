import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { Store } from "lucide-react";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Suspense fallback={<SellerLayoutSkeleton />}>
        <SellerAuthWrapper>{children}</SellerAuthWrapper>
      </Suspense>
    </SidebarProvider>
  );
}

async function SellerAuthWrapper({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  // 1. Basic Auth Guard
  if (!user) {
    redirect("/seller/login");
  }

  // 2. Role Array Guard
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const roles = Array.isArray(profile?.role) ? profile.role : [];
  
  if (roles.length === 0) {
    redirect("/login");
  }
  
  // 3. Fetch Store Data for Sidebar
  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1);
    
  const store = stores?.[0] || null;

  return (
    <>
      <SellerSidebar store={store} />
      <SidebarInset>
        <div className="flex flex-col min-h-screen bg-gray-50/50">
          {/* Dashboard Top Header */}
          <header className="flex items-center h-16 px-4 bg-white border-b sticky top-0 z-40 gap-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2 lg:hidden">
              <div className="p-1.5 bg-primary rounded-lg">
                <Store className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-primary">ambilidis</span>
            </div>
            {/* Context/Breadcrumbs could go here */}
            <div className="ml-auto flex items-center gap-4">
              {/* Optional: Notifications or other top actions */}
            </div>
          </header>

          <main className="flex-1">
            <div className="p-4 lg:p-8 max-w-5xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarInset>
    </>
  );
}

function SellerLayoutSkeleton() {
  return (
    <div className="flex w-full animate-pulse h-screen overflow-hidden">
      {/* Sidebar Skeleton */}
      <div className="hidden lg:flex flex-col w-64 border-r bg-white h-full p-6 space-y-8">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
      <div className="flex-1 flex flex-col">
        <header className="flex items-center h-16 px-4 bg-white border-b gap-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-6 w-32" />
        </header>
        <main className="p-4 lg:p-8 space-y-6 flex-1 bg-gray-50/50">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-32 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-3xl" />
        </main>
      </div>
    </div>
  );
}
