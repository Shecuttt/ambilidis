"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  MapPin, Store, Package, Bell, Edit3, Check, Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRp } from "@/lib/utils";

// Sub-components
import { DashboardStats } from "@/components/seller/DashboardStats";
import { ProductTable } from "@/components/seller/ProductTable";
import { AddProductDialog } from "@/components/seller/AddProductDialog";

// ── Tipe produk ──────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  is_available: boolean;
  photo_url: string | null;
}

export default function SellerDashboard() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Store state
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [grossRevenue, setGrossRevenue] = useState(0);

  // Sapaan hari ini (tagline_today)
  const [tagline, setTagline] = useState("");
  const [isSavingTagline, setIsSavingTagline] = useState(false);

  // Per-product availability toggling
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    setIsLoadingProducts(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let currentStoreId: string | null = null;
    const { data: storesData } = await supabase
      .from('stores')
      .select('id, is_open, name, tagline_today, latitude, longitude')
      .eq('owner_id', user.id)
      .limit(1);

    if (storesData && storesData.length > 0) {
      const s = storesData[0];
      currentStoreId = s.id;
      setStoreId(s.id);
      setIsOpen(s.is_open || false);
      setStoreName(s.name || "");
      setTagline(s.tagline_today || "");
      if (s.latitude && s.longitude) {
        setLocation({ lat: s.latitude, lng: s.longitude });
      }
    } else {
      const { data: newStore } = await supabase
        .from('stores')
        .insert([{ owner_id: user.id, name: "Toko Baru", is_open: false }])
        .select()
        .single();

      if (newStore) {
        currentStoreId = newStore.id;
        setStoreId(newStore.id);
        setStoreName(newStore.name);
      }
    }

    if (currentStoreId) {
      fetchDashboardData(currentStoreId);
    }

    setIsLoadingProducts(false);
  };

  const fetchDashboardData = async (sid: string) => {
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, price, unit, is_available, photo_url')
      .eq('store_id', sid)
      .order('created_at', { ascending: false });

    if (productsData) setProducts(productsData);

    const { count: activeCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', sid)
      .in('status', ['pending', 'accepted', 'in_delivery']);
    setActiveOrdersCount(activeCount || 0);

    const { count: pendingCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', sid)
      .eq('status', 'pending');
    setPendingOrdersCount(pendingCount || 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_price')
      .eq('store_id', sid)
      .eq('status', 'completed')
      .gte('created_at', todayISO);
      
    const todayRevenue = revenueData?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
    setGrossRevenue(todayRevenue);
  };

  // ── Location ─────────────────────────────────────────────
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
        setLocation({ lat, lng });
        setIsGettingLocation(false);

        if (storeId) {
          const { error } = await supabase
            .from('stores')
            .update({ latitude: lat, longitude: lng })
            .eq('id', storeId);

          if (error) {
            toast.error("Lokasi didapat tapi gagal disimpan. Coba lagi.");
          } else {
            toast.success("Lokasi berhasil disimpan!");
          }
        }
      },
      (err) => {
        console.error(err);
        toast.error("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.");
        setIsGettingLocation(false);
      }
    );
  };

  // ── Store name ────────────────────────────────────────────
  const handleUpdateStoreName = async () => {
    if (!storeId || !storeName.trim()) return;
    setIsSavingName(true);
    const { error } = await supabase
      .from('stores')
      .update({ name: storeName })
      .eq('id', storeId);
    setIsSavingName(false);
    if (error) {
      toast.error("Gagal menyimpan nama toko");
    } else {
      toast.success("Nama toko diperbarui");
    }
  };

  // ── Toggle buka/tutup ─────────────────────────────────────
  const handleToggleOpen = async (newStatus: boolean) => {
    setIsOpen(newStatus);
    if (storeId) {
      const { error } = await supabase
        .from('stores')
        .update({ is_open: newStatus })
        .eq('id', storeId);
      if (error) {
        setIsOpen(!newStatus);
        toast.error("Gagal mengubah status toko.");
      } else {
        toast.success(newStatus ? "Toko dibuka" : "Toko ditutup");
      }
    }
  };

  // ── Sapaan hari ini ───────────────────────────────────────
  const handleSaveTagline = async () => {
    if (!storeId) return;
    setIsSavingTagline(true);
    const { error } = await supabase
      .from('stores')
      .update({ tagline_today: tagline.trim() || null })
      .eq('id', storeId);
    setIsSavingTagline(false);
    if (error) {
      toast.error("Gagal menyimpan sapaan.");
    } else {
      toast.success("Sapaan hari ini diperbarui");
    }
  };

  // ── Toggle stok cepat ─────────────────────────────────────
  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    setTogglingProductId(productId);
    const newStatus = !currentStatus;

    setProducts(prev =>
      prev.map(p => p.id === productId ? { ...p, is_available: newStatus } : p)
    );

    const { error } = await supabase
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', productId);

    if (error) {
      // Revert on error
      setProducts(prev =>
        prev.map(p => p.id === productId ? { ...p, is_available: currentStatus } : p)
      );
      toast.error("Gagal mengupdate stok produk.");
    } else {
      toast.success(newStatus ? "Produk tersedia" : "Produk habis");
    }

    setTogglingProductId(null);
  };

  const onProductAdded = (newProd: Product) => {
    setProducts([newProd, ...products]);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Seller</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r pr-4">
            <Store className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="store-status" className="font-medium text-lg cursor-pointer">
              {isOpen ? "Toko Buka" : "Toko Tutup"}
            </Label>
            <Switch
              id="store-status"
              checked={isOpen}
              onCheckedChange={handleToggleOpen}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
          <Link href="/seller/orders">
            <Button variant="outline" className="relative">
              <Bell className="h-4 w-4 mr-2" />
              Pesanan
              {pendingOrdersCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-bounce">
                  {pendingOrdersCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Grid: Profil Toko + Ringkasan ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Store Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Profil Toko
            </CardTitle>
            <CardDescription>Atur informasi dasar toko Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nama toko */}
            <div className="space-y-1">
              <Label>Nama Toko</Label>
              <div className="flex gap-2">
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nama Toko Anda"
                />
                <Button onClick={handleUpdateStoreName} disabled={isSavingName}>
                  {isSavingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Sapaan Hari Ini */}
            <div className="space-y-1">
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
                  className="resize-none text-sm"
                  rows={2}
                />
                <Button onClick={handleSaveTagline} disabled={isSavingTagline} size="sm" className="mt-0.5 shrink-0">
                  {isSavingTagline ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-right">{tagline.length}/100</p>
            </div>

            {/* Lokasi */}
            <div className="space-y-1">
              <Label>Lokasi Toko</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                <MapPin className="h-4 w-4 shrink-0" />
                {location
                  ? `Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}`
                  : "Lokasi belum diatur"}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpdateLocation} disabled={isGettingLocation} variant="secondary" className="w-full">
              {isGettingLocation
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Mendapatkan Lokasi...</>
                : <><MapPin className="h-4 w-4 mr-2" />Update Lokasi dari Perangkat</>
              }
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Stats Card */}
        <DashboardStats
          activeOrdersCount={activeOrdersCount}
          productsCount={products.length}
          grossRevenue={grossRevenue}
        />
      </div>

      {/* ── Products Management ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5" />
              Kelola Produk
            </CardTitle>
            <CardDescription>Daftar produk yang Anda jual. Toggle untuk ubah stok langsung.</CardDescription>
          </div>

          <AddProductDialog storeId={storeId} onProductAdded={onProductAdded} />
        </CardHeader>

        <CardContent>
          <ProductTable
            products={products}
            isLoading={isLoadingProducts}
            togglingProductId={togglingProductId}
            onToggleAvailability={handleToggleAvailability}
          />
        </CardContent>
      </Card>
    </div>
  );
}
