"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { generateSlug } from "@/lib/slug";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, MapPin, Loader2 } from "lucide-react";
import { LocationSearch } from "@/components/ui/location-search";

interface SellerSetupClientProps {
  user: any;
}

export function SellerSetupClient({ user }: SellerSetupClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storeLocation, setStoreLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!storeName.trim()) {
      toast.error("Nama toko wajib diisi");
      return;
    }

    if (!storeLocation) {
      toast.error("Lokasi toko wajib dipilih");
      return;
    }

    setIsLoading(true);

    try {
      // Generate slug from store name
      const slug = generateSlug(storeName);

      // Create store using API route (server-side auth)
      const response = await fetch('/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: storeName.trim(),
          slug: slug,
          description: storeDescription.trim() || null,
          address: storeAddress.trim() || null,
          location: `POINT(${storeLocation.lng} ${storeLocation.lat})`,
        }),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create store');
      }

      const store = result.store;

      toast.success("Toko berhasil dibuat! Anda sekarang dapat mengelola toko Anda.");
      
      // Redirect to dashboard
      router.push("/seller/dashboard");
      router.refresh();

    } catch (error: any) {
      console.error("Store creation error:", error);
      toast.error("Gagal membuat toko: " + (error.message || "Terjadi kesalahan"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationSelect = (location: { lat: number; lng: number; label: string }) => {
    setStoreLocation({ lat: location.lat, lng: location.lng });
    setStoreAddress(location.label);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4">
      <div className="w-full max-w-2xl">
        <Card className="shadow-lg border-0">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Store className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-primary">
              Setup Toko Baru
            </CardTitle>
            <CardDescription>
              Lengkapi informasi toko Anda untuk memulai berjualan
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Store Name */}
              <div className="space-y-2">
                <Label htmlFor="storeName">Nama Toko *</Label>
                <Input
                  id="storeName"
                  placeholder="Masukkan nama toko Anda"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
              </div>

              {/* Store Description */}
              <div className="space-y-2">
                <Label htmlFor="storeDescription">Deskripsi Toko</Label>
                <Textarea
                  id="storeDescription"
                  placeholder="Ceritakan tentang toko Anda..."
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Store Location */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Lokasi Toko *
                  </Label>
                  <LocationSearch
                    onLocationSelect={handleLocationSelect}
                    placeholder="Cari lokasi toko Anda..."
                  />
                </div>

                {storeLocation && (
                  <Alert className="bg-green-50 border-green-200">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Lokasi toko: {storeAddress || `${storeLocation.lat.toFixed(6)}, ${storeLocation.lng.toFixed(6)}`}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Note about store being closed */}
              <Alert className="bg-blue-50 border-blue-200">
                <Store className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Toko baru akan dibuat dalam status <strong>Tutup</strong>. Anda dapat membukanya kapan saja setelah setup selesai.
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !storeName.trim() || !storeLocation}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Membuat Toko...
                  </>
                ) : (
                  "Buat Toko"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
