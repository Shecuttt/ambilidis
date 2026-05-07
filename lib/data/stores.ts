import { cacheLife, cacheTag } from "next/cache";

/**
 * Fetch all active stores with global caching.
 * 'use cache' ensures the database query is only run once and shared across users.
 */
export async function getCachedStores() {
  "use cache";
  // Cache for 5 minutes. This is public data, so we can cache it globally.
  cacheLife("minutes");
  cacheTag("stores");

  // Since 'use cache' is a global cache, we can't use cookies-based supabase client here
  // We should use a service role client or a public anonymous client that doesn't depend on request context.
  // For simplicity, we'll use the anonymous client.
  const { createClient: createPublicClient } = await import("@supabase/supabase-js");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createPublicClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("stores")
    .select("id, slug, name, description, is_open, latitude, longitude, tagline_today, operating_hours, logo_url, banner_url")
    .order("is_open", { ascending: false });

  if (error) {
    console.error("Error fetching stores for cache:", error);
    return [];
  }

  return data || [];
}
