import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OrdersPageClient } from "@/components/seller/OrdersPageClient";

async function getOrdersPageData() {
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
    redirect("/login");
  }

  // Redirect to setup if seller doesn't have a store yet
  if (!stores?.[0]) {
    redirect("/seller/setup");
  }

  const store = stores[0];

  // Fetch orders with items
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      total_price,
      status,
      created_at,
      updated_at,
      payment_method,
      payment_status,
      buyer_note,
      rejection_reason,
      order_items (
        id,
        quantity,
        price,
        products (name, unit)
      ),
      profiles!orders_buyer_id_fkey (
        address,
        full_name,
        phone
      )
    `)
    .eq('store_id', store.id)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error("Orders fetch error:", ordersError);
    redirect("/login");
  }

  return {
    user,
    store,
    orders: orders || []
  };
}

export default async function OrdersPage() {
  const { user, store, orders } = await getOrdersPageData();

  return (
    <OrdersPageClient 
      initialUser={user}
      initialStore={store}
      initialOrders={orders}
    />
  );
}
