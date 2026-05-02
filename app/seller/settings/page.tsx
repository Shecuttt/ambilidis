import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SettingsPageClient } from "@/components/seller/SettingsPageClient";

async function getSettingsPageData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // Fetch store
  const { data: stores, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('owner_id', user.id)
    .limit(1);

  if (storeError || !stores?.[0]) {
    redirect("/login");
  }

  const store = stores[0];

  return {
    user,
    store
  };
}

export default async function SettingsPage() {
  const { user, store } = await getSettingsPageData();

  return (
    <SettingsPageClient 
      initialUser={user}
      initialStore={store}
    />
  );
}
