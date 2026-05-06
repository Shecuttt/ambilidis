"use client";

import { useState } from "react";
import { MapPin, Navigation, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LocationSearch } from "@/components/ui/location-search";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UserLocation {
  lat: number;
  lng: number;
  label?: string;
}

interface LocationBannerProps {
  onLocationSet: (loc: UserLocation) => void;
}


const LOC_KEY = "ambilidis_buyer_location";

export function saveLocation(loc: UserLocation) {
  try { sessionStorage.setItem(LOC_KEY, JSON.stringify(loc)); } catch { /* ignore */ }
}

export function loadSavedLocation(): UserLocation | null {
  try {
    const raw = sessionStorage.getItem(LOC_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearSavedLocation() {
  try { sessionStorage.removeItem(LOC_KEY); } catch { /* ignore */ }
}

// Save location to user profile in database
export async function saveLocationToProfile(location: UserLocation) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('No authenticated user, skipping profile save');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        address: location.label || 'Lokasi pengguna',
        location: `POINT(${location.lng} ${location.lat})`, // PostGIS POINT format: longitude latitude
      });

    if (error) {
      console.error('Error saving location to profile:', error);
    } else {
      console.log('Location saved to profile successfully');
    }
  } catch (error) {
    console.error('Error in saveLocationToProfile:', error);
  }
}

/**
 * Mengambil alamat (display_name) dari koordinat menggunakan Nominatim API (OpenStreetMap).
 */
async function getAddressFromCoords(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "id",
          "User-Agent": "Ambilidis-App",
        },
      }
    );
    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error("Error reverse geocoding:", error);
    return null;
  }
}

/**
 * LocationBanner — Ditampilkan saat lokasi buyer belum diset.
 * Mendukung GPS (navigator.geolocation) dan input koordinat manual sebagai fallback.
 */
export function LocationBanner({ onLocationSet }: LocationBannerProps) {
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const handleRequestGPS = () => {
    setIsGettingGPS(true);
    setGpsError(false);
    if (!("geolocation" in navigator)) {
      setGpsError(true);
      setIsGettingGPS(false);
      setShowManual(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Ambil alamat asli dari Nominatim
        const address = await getAddressFromCoords(lat, lng);

        const loc: UserLocation = {
          lat,
          lng,
          label: address || "Lokasi GPS",
        };
        saveLocation(loc);
        onLocationSet(loc);
        // Save to profile database
        await saveLocationToProfile(loc);
        setIsGettingGPS(false);
      },
      () => {
        setGpsError(true);
        setIsGettingGPS(false);
        setShowManual(true);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-linear-to-br from-primary to-primary/90" />

      {/* Decorative patterns (optional but premium) */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-black blur-3xl" />
      </div>
      {/* Content */}
      <div className="relative z-10 p-8 text-center space-y-5">
        <div className="mx-auto bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-full w-fit shadow-lg">
          <MapPin className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Temukan Toko Terdekat</h2>
          <p className="text-white/80 text-sm max-w-xs mx-auto">
            Izinkan akses lokasi untuk melihat warung dan toko segar di sekitarmu, diurutkan berdasarkan jarak.
          </p>
        </div>

        {!showManual ? (
          <div className="space-y-3 max-w-xs mx-auto">
            <Button
              onClick={handleRequestGPS}
              disabled={isGettingGPS}
              size="lg"
              className="w-full rounded-xl font-semibold bg-white text-primary hover:bg-white/90 shadow-lg"
            >
              {isGettingGPS
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mencari lokasi...</>
                : <><Navigation className="mr-2 h-4 w-4" />Gunakan Lokasi GPS</>
              }
            </Button>
            <button
              onClick={() => setShowManual(true)}
              className="text-white/70 text-sm hover:text-white underline underline-offset-2 transition-colors"
            >
              Cari alamat manual
            </button>
            {/* shadcn Alert untuk error GPS */}
            {gpsError && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-400/30 text-white">
                <AlertDescription className="text-red-200 text-xs">
                  GPS ditolak browser. Gunakan pencarian manual di bawah.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          /* Location search input */
          <div className="max-w-xs mx-auto space-y-3">
            <p className="text-white/80 text-xs text-center">
              Cari alamat atau lokasi yang kamu inginkan.
            </p>
            <LocationSearch
              onLocationSelect={async (location) => {
                const loc: UserLocation = {
                  lat: location.lat,
                  lng: location.lng,
                  label: location.label
                };
                saveLocation(loc);
                onLocationSet(loc);
                // Save to profile database
                await saveLocationToProfile(loc);
              }}
              placeholder="Cari alamat atau lokasi..."
              className="w-full"
              variant="dark"
            />
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="text-white/60 text-sm hover:text-white"
            >
              ← Kembali ke GPS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * LocationBar — Compact bar yang ditampilkan ketika lokasi sudah diset.
 */
export function LocationBar({
  location,
  onClear,
}: {
  location: { lat: number; lng: number; label?: string };
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-card px-4 py-3 rounded-xl border border-border shadow-sm">
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <MapPin className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-foreground block">Lokasi Anda</span>
        <span className="text-xs text-muted-foreground truncate block italic">
          {location.label || `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`}
        </span>
      </div>
      <button
        onClick={onClear}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted"
        title="Ubah lokasi"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
