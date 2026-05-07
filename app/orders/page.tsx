import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OrdersPageClient } from "@/components/orders/OrdersPageClient";
import { Suspense } from "react";

async function getOrdersPageData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login?redirect=/orders");
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}

async function OrdersContent() {
  const { user, orders } = await getOrdersPageData();

  return (
    <OrdersPageClient 
      initialUser={user}
      initialOrders={orders}
    />
  );
}

function OrdersSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-muted rounded-xl" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full bg-muted rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
