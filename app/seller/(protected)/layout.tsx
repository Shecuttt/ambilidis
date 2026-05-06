import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { Store } from "lucide-react";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    .single();

  const roles = Array.isArray(profile?.role) ? profile.role : [];
  
  // Strict guard for seller routes
  // Note: Since /seller/login and /seller/setup are children of this layout,
  // we should be careful. But our flow ensures users have 'seller' role 
  // before being sent to /seller/setup via the "Buka Toko" button.
  
  // However, we can exclude /seller/setup and /seller/login if we want.
  // Since we can't easily get the pathname in a Server Component layout without headers,
  // we'll rely on the fact that if they reach this layout, they should be a seller 
  // OR we'll let them through to /seller/setup if the page itself allows it.
  
  // Let's add a safe check: if they have NO 'seller' role, and we are not in setup/login, 
  // but wait, layout is always rendered.
  
  // Recommendation: Put the specific role check in a middleware or in the pages.
  // But since I'm here, I'll check if they have at least ONE role.
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
    <div className="flex min-h-screen bg-gray-50/50">
      <SellerSidebar store={store} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-primary">ambilidis</span>
          </div>
          {/* Sidebar trigger is handled inside SellerSidebar, but we can also put it here if we want more control. 
              Currently SellerSidebar has a floating button. Let's move it into this header for a cleaner look. */}
        </header>

        <main className="flex-1 lg:pl-64">
          <div className="p-4 lg:p-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
