"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingBag, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { supabase } from "@/lib/supabase";
import { haversineKm } from "@/lib/utils";
import { StoreCard } from "@/components/StoreCard";
import { LocationBanner, LocationBar, loadSavedLocation, clearSavedLocation } from "@/components/LocationBanner";
import Link from "next/link";
import { useCartStore } from "@/lib/store";

// ── Types ─────────────────────────────────────────────────────
interface StoreWithDistance {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  is_open: boolean;
  latitude: number | null;
  longitude: number | null;
  tagline_today: string | null;
  distance_km: number | null;
}

interface UserLocation {
  lat: number;
  lng: number;
  label?: string;
}

// ── Main Component ────────────────────────────────────────────
export default function BuyerHome() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [rawStores, setRawStores] = useState<StoreWithDistance[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const cartTotalItems = useCartStore(s => s.items.reduce((acc, item) => acc + item.quantity, 0));

  // ── On mount: restore saved location ───────────────────────
  useEffect(() => {
    const saved = loadSavedLocation();
    if (saved) setUserLocation(saved);
    fetchStores();
  }, []);

  // ── Fetch stores from Supabase ──────────────────────────────
  const fetchStores = async () => {
    setIsLoadingStores(true);
    const { data, error } = await supabase
      .from("stores")
      .select("id, name, description, photo_url, is_open, latitude, longitude, tagline_today")
      .order("is_open", { ascending: false });

    if (!error && data) {
      setRawStores(data.map(s => ({ ...s, distance_km: null })));
    }
    setIsLoadingStores(false);
  };

  // ── Compute distances when location changes ─────────────────
  const storesWithDist: StoreWithDistance[] = rawStores.map(store => {
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

  // Filter by search query
  const filteredStores = sortedStores.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const locationSet = !!userLocation;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-primary tracking-tight">ambilidis</h1>
          <div className="flex items-center gap-1">
            <Link href="/orders">
              <Button variant="ghost" size="icon" className="text-gray-600">
                <Receipt className="h-6 w-6" />
              </Button>
            </Link>
            <Link href="/checkout">
              <Button variant="ghost" size="icon" className="relative text-gray-600">
                <ShoppingBag className="h-6 w-6" />
                {cartTotalItems > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {cartTotalItems}
                  </span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="search"
            placeholder="Cari toko, beras, telur, sayur..."
            className="w-full pl-10 pr-4 h-12 bg-white rounded-xl shadow-sm border-gray-200 focus-visible:ring-primary"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* ── Store Grid ── */}
        <div className={`space-y-4 transition-all duration-300 ${!locationSet ? "opacity-30 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">
              {locationSet ? "Toko di Sekitarmu" : "Toko Terdekat"}
            </h2>
            {locationSet && (
              <span className="text-xs text-gray-500 font-medium">
                {filteredStores.filter(s => s.is_open).length} toko buka
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {isLoadingStores ? (
              /* Skeleton loading menggunakan shadcn <Skeleton /> */
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-white border shadow-sm overflow-hidden">
                  <Skeleton className="h-36 w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))
            ) : filteredStores.length === 0 ? (
              /* Empty state menggunakan shadcn <Empty /> */
              <div className="col-span-full">
                <Empty className="bg-white border border-dashed py-12">
                  <EmptyHeader>
                    <EmptyMedia>🏪</EmptyMedia>
                    <EmptyTitle>
                      {searchQuery ? `Toko "${searchQuery}" tidak ditemukan` : "Belum ada toko terdaftar"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {searchQuery ? "Coba kata kunci lain." : "Toko akan muncul di sini setelah mendaftar."}
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
        {!locationSet && !isLoadingStores && (
          <p className="text-center text-sm text-gray-400 -mt-2">
            Aktifkan lokasi di atas untuk melihat toko dan jarak terdekat
          </p>
        )}

      </main>
    </div>
  );
}
