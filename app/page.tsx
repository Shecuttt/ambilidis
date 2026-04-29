"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, ShoppingBag, Store, Star, Clock, Navigation, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useCartStore } from "@/lib/store";

export default function BuyerHome() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  const cartItems = useCartStore(state => state.items);
  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setIsLoadingStores(true);
    // For MVP, we fetch all stores. Later we can filter by PostGIS distance.
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching stores:", error);
    } else if (data) {
      setStores(data);
    }
    setIsLoadingStores(false);
  };

  const handleRequestLocation = () => {
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsGettingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Gagal mendapatkan lokasi. Pastikan izin lokasi di browser telah diaktifkan.");
          setIsGettingLocation(false);
        }
      );
    } else {
      alert("Browser Anda tidak mendukung fitur lokasi.");
      setIsGettingLocation(false);
    }
  };

  // Default images based on consistent hash of ID or just a generic placeholder
  const getPlaceholderImage = (id: string) => {
    const images = [
      "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=400&h=300",
      "https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=400&h=300",
      "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=300",
      "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400&h=300"
    ];
    // Simple sum of char codes to pick an image consistently
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return images[sum % images.length];
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary tracking-tight">ambilidis</h1>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/orders">
              <Button variant="ghost" size="icon" className="relative text-gray-600">
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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        
        {/* Location Request Banner */}
        {!location ? (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center space-y-4 max-w-2xl mx-auto">
            <div className="mx-auto bg-white p-3 rounded-full w-fit shadow-sm">
              <MapPin className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-gray-900">Temukan Toko Terdekat</h2>
              <p className="text-sm text-gray-600">
                Izinkan akses lokasi untuk melihat warung dan toko sembako di sekitarmu.
              </p>
            </div>
            <Button 
              onClick={handleRequestLocation} 
              disabled={isGettingLocation}
              className="w-full rounded-xl font-semibold shadow-sm"
              size="lg"
            >
              {isGettingLocation ? (
                "Mencari lokasi..."
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  Gunakan Lokasi Saat Ini
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-xl border shadow-sm max-w-2xl mx-auto">
            <MapPin className="h-5 w-5 text-green-500 shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-medium text-gray-900 block">Lokasi Anda</span>
              <span className="truncate">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input 
            type="search" 
            placeholder="Cari beras, telur, sayur..." 
            className="w-full pl-10 pr-4 h-12 bg-white rounded-xl shadow-sm border-gray-200 focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Nearby Stores Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Toko di Sekitarmu</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingStores ? (
              <div className="col-span-full text-center py-10 text-muted-foreground">Mencari toko...</div>
            ) : stores.length === 0 ? (
              <div className="col-span-full text-center py-10 text-muted-foreground bg-white rounded-2xl border border-dashed">
                Belum ada toko yang terdaftar.
              </div>
            ) : (
              stores.map((store) => (
                <Link key={store.id} href={`/store/${store.id}`}>
                  <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-2xl group h-full">
                    <div className="flex flex-col h-full">
                      <div className="w-full h-32 relative bg-gray-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={store.photo_url || getPlaceholderImage(store.id)} 
                          alt={store.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {!store.is_open && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                            <span className="text-white text-xs font-bold px-2 py-1 border border-white/50 rounded-md">TUTUP</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4 flex flex-col justify-between flex-1 bg-white">
                        <div className="space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">
                              {store.name}
                            </h3>
                          </div>
                          <p className="text-xs text-gray-500 flex items-center gap-1 line-clamp-1">
                            <Store className="h-3 w-3 shrink-0" />
                            {store.description || "Toko Sembako"}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center gap-3 text-xs font-medium">
                            <span className="flex items-center text-amber-500">
                              <Star className="h-3.5 w-3.5 fill-current mr-1" />
                              4.8
                            </span>
                            <span className="flex items-center text-gray-500">
                              <Navigation className="h-3 w-3 mr-1" />
                              1.5 km
                            </span>
                          </div>
                          
                          {store.is_open && (
                            <div className="flex items-center text-green-600 text-xs font-bold">
                              <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                              Buka
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
