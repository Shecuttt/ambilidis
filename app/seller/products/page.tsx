import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProductsPageClient } from "@/components/seller/ProductsPageClient";

async function getProductsPageData() {
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

  // Fetch products
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, unit, is_available, photo_url')
    .eq('store_id', store.id)
    .order('created_at', { ascending: false });

  if (productsError) {
    console.error("Products fetch error:", productsError);
    redirect("/login");
  }

  return {
    user,
    store,
    products: products || []
  };
}

export default async function ProductsPage() {
  const { user, store, products } = await getProductsPageData();

  return (
    <ProductsPageClient 
      initialUser={user}
      initialStore={store}
      initialProducts={products}
    />
  );
}
