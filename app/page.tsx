"use client";

import { useState } from "react";
import { MapPin, Search, ShoppingBag, Store, Star, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// Dummy data for nearby stores
const DUMMY_STORES = [
  {
    id: 1,
    name: "Toko Sembako Makmur",
    category: "Sembako",
    distance: "0.5 km",
    rating: 4.8,
    isOpen: true,
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=400&h=300",
  },
  {
    id: 2,
    name: "Agen Beras Jaya",
    category: "Beras & Telur",
    distance: "0.8 km",
    rating: 4.9,
    isOpen: true,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=400&h=300",
  },
  {
    id: 3,
    name: "Warung Sayur Bu Tejo",
    category: "Sayur & Buah",
    distance: "1.2 km",
    rating: 4.5,
    isOpen: false,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=300",
  },
  {
    id: 4,
    name: "Toko Kelontong Barokah",
    category: "Sembako",
    distance: "1.5 km",
    rating: 4.6,
    isOpen: true,
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400&h=300",
  },
];

export default function BuyerHome() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary tracking-tight">ambilidis</h1>
          </div>
          <Button variant="ghost" size="icon" className="relative text-gray-600">
            <ShoppingBag className="h-6 w-6" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              0
            </span>
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-8">
        
        {/* Location Request Banner */}
        {!location ? (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 text-center space-y-4">
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
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-3 rounded-xl border shadow-sm">
            <MapPin className="h-5 w-5 text-green-500 shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-medium text-gray-900 block">Lokasi Anda</span>
              <span className="truncate">Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}</span>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
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

          <div className="grid grid-cols-1 gap-4">
            {DUMMY_STORES.map((store) => (
              <Card key={store.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-2xl group">
                <div className="flex h-32">
                  <div className="w-1/3 relative bg-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={store.image} 
                      alt={store.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {!store.isOpen && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="text-white text-xs font-bold px-2 py-1 border border-white/50 rounded-md">TUTUP</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="w-2/3 p-4 flex flex-col justify-between bg-white">
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">
                          {store.name}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {store.category}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3 text-xs font-medium">
                        <span className="flex items-center text-amber-500">
                          <Star className="h-3.5 w-3.5 fill-current mr-1" />
                          {store.rating}
                        </span>
                        <span className="flex items-center text-gray-500">
                          <Navigation className="h-3 w-3 mr-1" />
                          {store.distance}
                        </span>
                      </div>
                      
                      {store.isOpen && (
                        <div className="flex items-center text-green-600 text-xs font-bold">
                          <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                          Buka
                        </div>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
