"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Settings, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Sub-components
import { StoreSettings } from "@/components/seller/StoreSettings";

interface SettingsPageClientProps {
  initialUser: any;
  initialStore: any;
}

export function SettingsPageClient({
  initialUser,
  initialStore
}: SettingsPageClientProps) {
  const router = useRouter();
  const [storeData, setStoreData] = useState(initialStore);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(initialStore?.is_open || false);

  useEffect(() => {
    // Real-time updates untuk store settings
    const channel = supabase
      .channel('store-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${storeData?.id}`
        },
        (payload) => {
          if (payload.new) {
            setStoreData(payload.new);
            setIsOpen(payload.new.is_open);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeData?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Pengaturan {initialStore?.name}
        </h1>
        <p className="text-muted-foreground text-sm">Kelola informasi dan pengaturan tokomu.</p>
      </div>

      {/* Store Settings */}
      <StoreSettings
        storeId={storeData.id}
        initialName={storeData.name}
        initialTagline={storeData.tagline_today || ""}
        initialLogoUrl={storeData.logo_url}
        initialBannerUrl={storeData.banner_url}
        initialDescription={storeData.description}
        initialAddress={storeData.address}
        initialLocation={storeData.latitude ? { lat: storeData.latitude, lng: storeData.longitude } : null}
        initialOperatingHours={storeData.operating_hours}
        isOpen={isOpen}
        onUpdateStatus={setIsOpen}
      />
    </div>
  );
}
