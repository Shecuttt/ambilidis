import { getCachedStores } from "@/lib/data/stores";
import { DiscoveryPageClient } from "@/components/discovery/DiscoveryPageClient";

export default async function DiscoveryPage() {
  // Fetch stores using the new 'use cache' model
  const initialStores = await getCachedStores();

  return (
    <DiscoveryPageClient initialStores={initialStores} />
  );
}
