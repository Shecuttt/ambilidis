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

const BG_IMAGE =
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=800";

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
 * LocationBanner — Ditampilkan saat lokasi buyer belum diset.
 * Mendukung GPS (navigator.geolocation) dan input koordinat manual sebagai fallback.
 */
export function LocationBanner({ onLocationSet }: LocationBannerProps) {
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

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
        const loc: UserLocation = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "GPS",
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

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert("Koordinat tidak valid. Lat: -90 s/d 90, Lng: -180 s/d 180.");
      return;
    }
    const loc: UserLocation = { lat, lng, label: "Manual" };
    saveLocation(loc);
    onLocationSet(loc);
    // Save to profile database
    await saveLocationToProfile(loc);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden">
      {/* Background blur */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${BG_IMAGE})`, filter: "blur(8px) brightness(0.4)" }}
      />
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
              Input koordinat manual
            </button>
            {/* shadcn Alert untuk error GPS */}
            {gpsError && (
              <Alert variant="destructive" className="bg-red-500/20 border-red-400/30 text-white">
                <AlertDescription className="text-red-200 text-xs">
                  GPS ditolak browser. Gunakan input manual di bawah.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          /* Location search input */
          <div className="max-w-xs mx-auto space-y-3">
            <p className="text-white/80 text-xs">
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
 * Menampilkan koordinat dan tombol untuk menghapus/mengubah lokasi.
 */
export function LocationBar({
  location,
  onClear,
}: {
  location: { lat: number; lng: number; label?: string };
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border shadow-sm">
      <MapPin className="h-4 w-4 text-green-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm text-gray-900 block">Lokasi Anda</span>
        <span className="text-xs text-gray-500 truncate block">
          {location.label === "Manual" ? "Input Manual — " : "GPS — "}
          {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
        </span>
      </div>
      <button
        onClick={onClear}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
        title="Ubah lokasi"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
