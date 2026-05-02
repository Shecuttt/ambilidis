import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OrdersPageClient } from "@/components/orders/OrdersPageClient";

async function getOrdersPageData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login");
  }

  // Fetch buyer orders with ratings
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
      stores (
        id,
        name
      ),
      ratings (
        rating,
        complaints
      )
    `)
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false });

  if (ordersError) {
    console.error("Orders fetch error:", ordersError);
    redirect("/login");
  }

  return {
    user,
    orders: orders || []
  };
}

export default async function OrdersPage() {
  const { user, orders } = await getOrdersPageData();

  return (
    <OrdersPageClient 
      initialUser={user}
      initialOrders={orders}
    />
  );
}
