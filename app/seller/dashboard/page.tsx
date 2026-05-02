import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SellerDashboardClient } from "@/components/seller/SellerDashboardClient";

async function getSellerDashboardData() {
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

  if (storeError) {
    console.error("Store fetch error:", storeError);
    redirect("/login");
  }

  let store = stores?.[0];

  // Create store if not exists
  if (!store) {
    const { data: newStore, error: createError } = await supabase
      .from('stores')
      .insert([{ 
        owner_id: user.id, 
        name: "Toko Baru", 
        is_open: false 
      }])
      .select()
      .single();

    if (createError) {
      console.error("Store creation error:", createError);
      redirect("/login");
    }

    store = newStore;
  }

  // Sync Store Status based on Operating Hours
  const { isStoreWithinHours } = await import("@/lib/store-utils");
  if (store.operating_hours) {
    const shouldBeOpen = isStoreWithinHours(store.operating_hours);
    if (shouldBeOpen !== store.is_open) {
      const { data: updatedStore } = await supabase
        .from('stores')
        .update({ is_open: shouldBeOpen })
        .eq('id', store.id)
        .select()
        .single();
      if (updatedStore) store = updatedStore;
    }
  }

  // Fetch stats
  const [
    { count: activeCount },
    { count: pendingCount },
    { data: revenueData },
    { count: productsCount }
  ] = await Promise.all([
    // Active orders
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id)
      .in('status', ['pending', 'accepted', 'in_delivery']),
    
    // Pending orders
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id)
      .eq('status', 'pending'),
    
    // Today's revenue
    supabase
      .from('orders')
      .select('total_price')
      .eq('store_id', store.id)
      .eq('status', 'completed')
      .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    
    // Products count
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', store.id)
  ]);

  const todayRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;

  const stats = {
    activeOrdersCount: activeCount || 0,
    productsCount: productsCount || 0,
    grossRevenue: todayRevenue
  };

  return {
    user,
    store,
    stats
  };
}

export default async function SellerDashboardPage() {
  const { user, store, stats } = await getSellerDashboardData();

  return (
    <SellerDashboardClient 
      initialUser={user}
      initialStore={store}
      initialStats={stats}
    />
  );
}
