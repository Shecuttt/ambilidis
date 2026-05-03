import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CheckoutPageClient } from "@/components/checkout/CheckoutPageClient";

async function getCheckoutPageData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect("/login?redirect=/checkout");
  }

  return {
    user
  };
}

export default async function CheckoutPage() {
  const { user } = await getCheckoutPageData();

  return (
    <CheckoutPageClient 
      initialUser={user}
    />
  );
}
