import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SellerSetupClient } from "@/components/seller/SellerSetupClient";

async function getSellerSetupData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // Check if user already has a store
  const { data: stores, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1);

  if (storeError) {
    console.error("Store fetch error:", storeError);
    redirect("/login");
  }

  // If user already has a store, redirect to dashboard
  if (stores && stores.length > 0) {
    redirect("/seller/dashboard");
  }

  return { user };
}

export default async function SellerSetupPage() {
  const { user } = await getSellerSetupData();

  return <SellerSetupClient user={user} />;
}
