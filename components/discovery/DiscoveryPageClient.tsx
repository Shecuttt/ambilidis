"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { haversineKm } from "@/lib/utils";
import { StoreCard } from "@/components/StoreCard";
import { LocationBanner, LocationBar, loadSavedLocation, clearSavedLocation } from "@/components/LocationBanner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// ── Types ─────────────────────────────────────────────────────
interface StoreWithDistance {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_open: boolean;
  latitude: number | null;
  longitude: number | null;
  tagline_today: string | null;
  distance_km: number | null;
  operating_hours: any;
  logo_url: string | null;
  banner_url: string | null;
}

interface UserLocation {
  lat: number;
  lng: number;
  label?: string;
}

const MAX_SERVICE_DISTANCE = 10; // KM

export function DiscoveryPageClient({ initialStores }: { initialStores: any[] }) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  // ── On mount: restore saved location ───────────────────────
  useEffect(() => {
    const saved = loadSavedLocation();
    if (saved) {
      // Defer state update to avoid cascading render lint error
      setTimeout(() => setUserLocation(saved), 0);
    }
    setTimeout(() => setIsHydrated(true), 0);
  }, []);

  // ── Compute distances when location changes ─────────────────
  const storesWithDist: StoreWithDistance[] = initialStores.map(store => {
    if (!userLocation || store.latitude == null || store.longitude == null) {
      return { ...store, distance_km: null };
    }
    return {
      ...store,
      distance_km: haversineKm(
        userLocation.lat, userLocation.lng,
        store.latitude, store.longitude
      ),
    };
  });

  // Sort: buka dulu, lalu jarak terdekat (null di paling belakang)
  const sortedStores = [...storesWithDist].sort((a, b) => {
    if (a.is_open !== b.is_open) return a.is_open ? -1 : 1;
    if (a.distance_km == null && b.distance_km == null) return 0;
    if (a.distance_km == null) return 1;
    if (b.distance_km == null) return -1;
    return a.distance_km - b.distance_km;
  });

  // Filter by search query AND distance
  const filteredStores = sortedStores.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    // Jika lokasi belum diset, tampilkan semua yang match search
    if (!userLocation) return matchesSearch;
    
    // Jika lokasi sudah diset, batasi jarak
    const withinRange = s.distance_km != null && s.distance_km <= MAX_SERVICE_DISTANCE;
    return matchesSearch && withinRange;
  });

  const locationSet = !!userLocation;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background pb-20">
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

          {/* ── Location Section ── */}
          {!locationSet ? (
            <LocationBanner onLocationSet={setUserLocation} />
          ) : (
            <LocationBar
              location={userLocation!}
              onClear={() => {
                setUserLocation(null);
                clearSavedLocation();
              }}
            />
          )}

          {/* ── Search Bar — disabled saat lokasi belum diset ── */}
          <div className={`relative transition-all duration-300 ${!locationSet ? "opacity-40 pointer-events-none" : ""}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari toko, beras, telur, sayur..."
              className="w-full pl-10 pr-4 h-12 bg-card rounded-xl shadow-sm border-border focus-visible:ring-primary"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* ── Store Grid ── */}
          <div className={`space-y-4 transition-all duration-300 ${!locationSet ? "opacity-30 pointer-events-none" : ""}`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">
                {locationSet ? "Toko di Sekitarmu" : "Toko Terdekat"}
              </h2>
              {locationSet && (
                <span className="text-xs text-muted-foreground font-medium">
                  Radius {MAX_SERVICE_DISTANCE}km • {filteredStores.filter(s => s.is_open).length} toko buka
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {!isHydrated ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-card border shadow-sm overflow-hidden">
                    <Skeleton className="h-36 w-full rounded-none" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))
              ) : filteredStores.length === 0 ? (
                <div className="col-span-full">
                  <Empty className="bg-card border border-dashed py-12">
                    <EmptyHeader>
                      <EmptyMedia>📍</EmptyMedia>
                      <EmptyTitle>
                        {searchQuery 
                          ? `Toko "${searchQuery}" tidak ditemukan` 
                          : locationSet 
                            ? "Tidak ada toko dalam jangkauanmu" 
                            : "Belum ada toko terdaftar"}
                      </EmptyTitle>
                      <EmptyDescription>
                        {searchQuery 
                          ? "Coba kata kunci lain atau perluas jangkauan." 
                          : locationSet 
                            ? `Maaf, saat ini belum ada toko dalam radius ${MAX_SERVICE_DISTANCE}km dari lokasimu.` 
                            : "Toko akan muncul di sini setelah mendaftar."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </div>
              ) : (
                filteredStores.map(store => (
                  <StoreCard key={store.id} {...store} />
                ))
              )}
            </div>
          </div>

          {/* Hint jika lokasi belum diset */}
          {!locationSet && isHydrated && (
            <p className="text-center text-sm text-muted-foreground -mt-2">
              Aktifkan lokasi di atas untuk melihat toko dalam jangkauan {MAX_SERVICE_DISTANCE}km
            </p>
          )}

        </main>
      </div>
      <Footer />
    </>
  );
}
