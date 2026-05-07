import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OrderDetailPageClient } from "@/components/orders/OrderDetailPageClient";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderContent params={params} />
    </Suspense>
  );
}

async function OrderContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Fetch authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect(`/login?redirect=/orders/${id}`);
  }

  // Fetch order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        id,
        quantity,
        price,
        products (
          name,
          unit,
          photo_url
        )
      ),
      stores (
        id,
        name,
        slug,
        address,
        owner_id
      ),
      order_status_logs (
        id,
        status,
        created_at
      )
    `)
    .eq('id', id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  // Security Check: Only Buyer can view this specific route
  const isBuyer = order.buyer_id === user.id;

  if (!isBuyer) {
    redirect('/orders');
  }

  return (
    <OrderDetailPageClient
      order={order}
      currentUser={user}
    />
  );
}

function OrderSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-8 animate-pulse">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
