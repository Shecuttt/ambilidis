"use client";

import { useState } from "react";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Store, Edit3, MapPin, Bell, Loader2, Check,
  ImageIcon,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatOperatingHours, isStoreWithinHours } from "@/lib/store-utils";
import { LocationSearch } from "@/components/ui/location-search";
import { generateSlug } from "@/lib/slug";

interface StoreSettingsProps {
  storeId: string;
  initialName: string;
  initialTagline: string;
  initialLogoUrl: string | null;
  initialBannerUrl: string | null;
  initialDescription: string | null;
  initialAddress: string | null;
  initialLocation: { lat: number; lng: number } | null;
  initialOperatingHours: any;
  onUpdateStatus: (isOpen: boolean) => void;
  isOpen: boolean;
}

export function StoreSettings({
  storeId,
  initialName,
  initialTagline,
  initialLogoUrl,
  initialBannerUrl,
  initialDescription,
  initialAddress,
  initialLocation,
  initialOperatingHours,
  onUpdateStatus,
  isOpen
}: StoreSettingsProps) {
  const [storeName, setStoreName] = useState(initialName);
  const [isSavingName, setIsSavingName] = useState(false);

  const [description, setDescription] = useState(initialDescription || "");
  const [isSavingDesc, setIsSavingDesc] = useState(false);

  const [address, setAddress] = useState(initialAddress || "");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  const [tagline, setTagline] = useState(initialTagline);
  const [isSavingTagline, setIsSavingTagline] = useState(false);

  const [location, setLocation] = useState(initialLocation);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [operatingHours, setOperatingHours] = useState(initialOperatingHours);
  const [isSavingHours, setIsSavingHours] = useState(false);

  // Logo & Banner State
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [bannerUrl, setBannerUrl] = useState(initialBannerUrl);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // ── Handlers ──
  const handleUploadImage = async (file: File, bucket: string, folder: string) => {
    if (!storeId) {
      toast.error("ID Toko tidak ditemukan");
      return null;
    }

    if (file.size > 1024 * 1024) {
      toast.error("Ukuran file maksimal 1MB");
      return null;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('folder', folder);
    formData.append('storeId', storeId);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengupload gambar');
      }

      return data.url;
    } catch (err: any) {
      console.error("Upload handler error:", err);
      toast.error(err.message || "Gagal mengupload gambar");
      return null;
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    const url = await handleUploadImage(file, 'stores', 'logo');

    if (url) {
      setLogoUrl(url);
      toast.success("Logo berhasil diperbarui");
    }
    setIsUploadingLogo(false);
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    const url = await handleUploadImage(file, 'stores', 'banner');

    if (url) {
      setBannerUrl(url);
      toast.success("Banner berhasil diperbarui");
    }
    setIsUploadingBanner(false);
  };

  const handleUpdateStoreName = async () => {
    if (!storeId || !storeName.trim()) return;
    setIsSavingName(true);
    try {
      // Generate slug from store name
      const slug = generateSlug(storeName);
      
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, name: storeName, slug }),
      });
      if (!res.ok) throw new Error('Gagal update nama');
      toast.success("Nama toko diperbarui");
    } catch (err) {
      toast.error("Gagal menyimpan nama toko");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleUpdateDescription = async () => {
    if (!storeId) return;
    setIsSavingDesc(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, description: description.trim() || null }),
      });
      if (!res.ok) throw new Error('Gagal update deskripsi');
      toast.success("Deskripsi toko diperbarui");
    } catch (err) {
      toast.error("Gagal menyimpan deskripsi");
    } finally {
      setIsSavingDesc(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!storeId) return;
    setIsSavingAddress(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, address: address.trim() || null }),
      });
      if (!res.ok) throw new Error('Gagal update alamat');
      toast.success("Alamat toko diperbarui");
    } catch (err) {
      toast.error("Gagal menyimpan alamat");
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSaveTagline = async () => {
    if (!storeId) return;
    setIsSavingTagline(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, tagline_today: tagline.trim() || null }),
      });
      if (!res.ok) throw new Error('Gagal update sapaan');
      toast.success("Sapaan hari ini diperbarui");
    } catch (err) {
      toast.error("Gagal menyimpan sapaan.");
    } finally {
      setIsSavingTagline(false);
    }
  };

  const handleUpdateLocation = () => {
    setIsGettingLocation(true);
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation tidak didukung browser ini.");
      setIsGettingLocation(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        try {
          const res = await fetch('/api/stores', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storeId, latitude: lat, longitude: lng }),
          });
          
          if (!res.ok) throw new Error('Gagal update lokasi');
          
          setLocation({ lat, lng });
          toast.success("Lokasi berhasil disimpan!");
        } catch (err) {
          toast.error("Gagal menyimpan lokasi.");
        } finally {
          setIsGettingLocation(false);
        }
      },
      (err) => {
        console.error(err);
        toast.error("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.");
        setIsGettingLocation(false);
      }
    );
  };

  const handleLocationSearchSelect = async (location: { lat: number; lng: number; label: string }) => {
    setIsGettingLocation(true);
    
    try {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, latitude: location.lat, longitude: location.lng }),
      });
      
      if (!res.ok) throw new Error('Gagal update lokasi');
      
      setLocation({ lat: location.lat, lng: location.lng });
      toast.success(`Lokasi berhasil disimpan: ${location.label}`);
    } catch (err) {
      toast.error("Gagal menyimpan lokasi.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSaveOperatingHours = async (newHours: any) => {
    if (!storeId) return;
    setIsSavingHours(true);
    try {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, operating_hours: newHours }),
      });

      if (!res.ok) throw new Error('Gagal update jam operasional');

      setOperatingHours(newHours);
      toast.success("Jam operasional diperbarui");
      
      // Auto-trigger is_open check
      const shouldBeOpen = isStoreWithinHours(newHours);
      if (shouldBeOpen !== isOpen) {
        await fetch('/api/stores', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId, is_open: shouldBeOpen }),
        });
        onUpdateStatus(shouldBeOpen);
      }
    } catch (err) {
      toast.error("Gagal menyimpan jam operasional.");
    } finally {
      setIsSavingHours(false);
    }
  };

  return (
    <Card id="settings" className="scroll-mt-20 overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Profil & Pengaturan Toko
        </CardTitle>
        <CardDescription>Atur informasi dasar dan operasional toko Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">

        {/* Branding: Banner & Logo */}
        <div className="space-y-4">
          <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground px-1">Identitas Visual</Label>

          <div className="relative">
            {/* Banner */}
            <div className="relative h-40 w-full bg-muted rounded-2xl overflow-hidden border group">
              {bannerUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground gap-2">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-sm font-medium">Belum ada banner</span>
                </div>
              )}

              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="bg-white/90 hover:bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer transition-transform hover:scale-105 shadow-lg">
                  <Camera className="h-4 w-4" />
                  Ganti Banner
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} disabled={isUploadingBanner} />
                </label>
              </div>
              {isUploadingBanner && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="absolute -bottom-6 left-6 group">
              <div className="relative h-20 w-20 rounded-2xl border-4 border-white bg-white shadow-xl overflow-hidden ring-1 ring-black/5">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50 text-muted-foreground">
                    <Store className="h-8 w-8" />
                  </div>
                )}

                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="h-5 w-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} disabled={isUploadingLogo} />
                </label>

                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="h-6" /> {/* Spacer for logo offset */}
        </div>

        {/* Info Dasar */}
        <div className="grid gap-6 pt-2">
          {/* Nama toko */}
          <div className="space-y-2">
            <Label>Nama Toko</Label>
            <div className="flex gap-2">
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Nama Toko Anda"
                className="rounded-xl h-11"
              />
              <Button onClick={handleUpdateStoreName} disabled={isSavingName} size="icon" className="h-11 w-11 rounded-xl">
                {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Deskripsi toko */}
          <div className="space-y-2">
            <Label>Deskripsi Toko</Label>
            <div className="flex gap-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan tentang tokomu..."
                className="rounded-xl h-24 resize-none"
              />
              <Button onClick={handleUpdateDescription} disabled={isSavingDesc} size="icon" className="h-11 w-11 rounded-xl shrink-0">
                {isSavingDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Sapaan Hari Ini */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Edit3 className="h-3.5 w-3.5" />
              Sapaan Hari Ini
              <span className="text-xs text-muted-foreground ml-1">(maks. 100 karakter)</span>
            </Label>
            <div className="flex gap-2 items-start">
              <Textarea
                value={tagline}
                onChange={(e) => setTagline(e.target.value.slice(0, 100))}
                placeholder='Contoh: "Ikan cakalang baru turun dari kapal! 🐟"'
                className="resize-none text-sm rounded-xl h-20"
              />
              <Button onClick={handleSaveTagline} disabled={isSavingTagline} size="icon" className="h-11 w-11 rounded-xl shrink-0">
                {isSavingTagline ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-right font-medium">{tagline.length}/100</p>
          </div>
        </div>

        {/* Alamat & Lokasi */}
        <div className="space-y-6 pt-2">
          <div className="space-y-2">
            <Label>Alamat Lengkap</Label>
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Raya No. 123..."
                className="rounded-xl h-11"
              />
              <Button onClick={handleUpdateAddress} disabled={isSavingAddress} size="icon" className="h-11 w-11 rounded-xl">
                {isSavingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cari Lokasi Toko</Label>
              <LocationSearch
                onLocationSelect={handleLocationSearchSelect}
                placeholder="Cari alamat toko..."
                disabled={isGettingLocation}
              />
            </div>
            
            <div className="flex items-center gap-3 text-sm text-muted-foreground bg-gray-50 p-4 rounded-2xl border">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 truncate">
                <p className="font-bold text-gray-900 leading-tight">Koordinat GPS</p>
                <p className="text-xs">
                  {location
                    ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
                    : "Lokasi belum diatur"}
                </p>
              </div>
              <Button onClick={handleUpdateLocation} disabled={isGettingLocation} variant="outline" size="sm" className="h-9 rounded-xl px-4 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                {isGettingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Edit3 className="h-4 w-4 mr-2" />}
                GPS
              </Button>
            </div>
          </div>
        </div>

        {/* Jam Operasional */}
        <div className="space-y-4 pt-6 border-t">
          <Label className="flex items-center gap-2 font-bold uppercase tracking-wider text-muted-foreground text-sm">
            <Bell className="h-4 w-4 text-primary" />
            Jadwal Operasional
          </Label>

          <div className="space-y-4 bg-muted/20 p-6 rounded-2xl border border-dashed border-primary/20">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Jam Buka</Label>
                <Input
                  type="time"
                  value={operatingHours?.open || "08:00"}
                  onChange={(e) => setOperatingHours((prev: any) => ({ ...prev, open: e.target.value }))}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Jam Tutup</Label>
                <Input
                  type="time"
                  value={operatingHours?.close || "17:00"}
                  onChange={(e) => setOperatingHours((prev: any) => ({ ...prev, close: e.target.value }))}
                  className="rounded-xl h-11"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-muted-foreground">Hari Buka</Label>
              <div className="flex flex-wrap gap-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((day, idx) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      const currentDays = operatingHours?.days || [1, 2, 3, 4, 5, 6];
                      const newDays = currentDays.includes(idx)
                        ? currentDays.filter((d: number) => d !== idx)
                        : [...currentDays, idx];
                      setOperatingHours((prev: any) => ({ ...prev, days: newDays }));
                    }}
                    className={`text-xs px-4 py-2.5 rounded-xl border-2 transition-all font-bold ${(operatingHours?.days || [1, 2, 3, 4, 5, 6]).includes(idx)
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-white text-muted-foreground border-gray-100 hover:border-primary/30"
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={() => handleSaveOperatingHours(operatingHours || { days: [1, 2, 3, 4, 5, 6], open: "08:00", close: "17:00" })}
              disabled={isSavingHours}
              className="w-full h-12 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all font-bold"
            >
              {isSavingHours ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Check className="h-5 w-5 mr-2" />}
              Simpan Perubahan Jadwal
            </Button>
          </div>

          <div className="flex gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 items-start">
            <div className="p-2 bg-amber-100 rounded-lg shrink-0">
              <Bell className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium italic">
              Sistem akan secara otomatis menyesuaikan status buka/tutup toko berdasarkan jadwal di atas setiap kali Anda masuk ke dashboard atau memperbarui jadwal ini.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
