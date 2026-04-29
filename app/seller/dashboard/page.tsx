"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Store, Plus, Package, Bell } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SellerDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Products state
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New product form state
  const [newProduct, setNewProduct] = useState({ name: "", price: "", unit: "" });

  // Store state
  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeName, setStoreName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [grossRevenue, setGrossRevenue] = useState(0);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    setIsLoadingProducts(true);

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    // 2. Get store for this user
    let currentStoreId = null;
    const { data: storesData, error: storeError } = await supabase
      .from('stores')
      .select('id, is_open, name')
      .eq('owner_id', user.id)
      .limit(1);

    if (storesData && storesData.length > 0) {
      currentStoreId = storesData[0].id;
      setStoreId(currentStoreId);
      setIsOpen(storesData[0].is_open || false);
      setStoreName(storesData[0].name || "");
    } else {
      // Auto create a default store for MVP if it doesn't exist
      const { data: newStore, error: insertError } = await supabase
        .from('stores')
        .insert([{ owner_id: user.id, name: "Toko Baru", is_open: false }])
        .select()
        .single();

      if (insertError) {
        console.error("Gagal membuat store otomatis:", insertError);
        alert(`Gagal membuat toko: ${insertError.message}`);
      } else if (newStore) {
        currentStoreId = newStore.id;
        setStoreId(currentStoreId);
        setIsOpen(false);
        setStoreName(newStore.name || "Toko Baru");
      }
    }

    // 3. Fetch data for this store
    if (currentStoreId) {
      // Fetch products
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', currentStoreId)
        .order('created_at', { ascending: false });

      if (!error && productsData) {
        setProducts(productsData);
      }

      // Fetch active orders count
      const { count: activeCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', currentStoreId)
        .in('status', ['pending', 'accepted', 'in_delivery']);
      
      setActiveOrdersCount(activeCount || 0);

      // Fetch pending orders count (for badge)
      const { count: pendingCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', currentStoreId)
        .eq('status', 'pending');
        
      setPendingOrdersCount(pendingCount || 0);

      // Fetch gross revenue (completed orders)
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_price')
        .eq('store_id', currentStoreId)
        .eq('status', 'completed');
        
      const totalRevenue = revenueData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0;
      setGrossRevenue(totalRevenue);
    }

    setIsLoadingProducts(false);
  };

  const handleUpdateLocation = () => {
    setIsGettingLocation(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setIsGettingLocation(false);
          // TODO: Save to Supabase using PostGIS ST_Point
          alert("Lokasi berhasil diupdate!");
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Gagal mendapatkan lokasi. Pastikan izin lokasi diberikan.");
          setIsGettingLocation(false);
        }
      );
    } else {
      alert("Geolocation tidak didukung oleh browser ini.");
      setIsGettingLocation(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.unit) return;

    if (!storeId) {
      alert("Store ID belum dimuat, harap tunggu.");
      return;
    }

    setIsSubmitting(true);

    const productToInsert = {
      store_id: storeId,
      name: newProduct.name,
      price: parseInt(newProduct.price),
      unit: newProduct.unit,
      is_available: true
    };

    const { data, error } = await supabase
      .from('products')
      .insert([productToInsert])
      .select();

    if (error) {
      console.error("Error adding product:", error);
      alert(`Gagal menambah produk: ${error.message}`);
    } else if (data) {
      setProducts([data[0], ...products]);
      setNewProduct({ name: "", price: "", unit: "" });
      setIsDialogOpen(false);
    }

    setIsSubmitting(false);
  };

  const handleUpdateStoreName = async () => {
    if (!storeId || !storeName.trim()) return;
    setIsSavingName(true);
    const { error } = await supabase
      .from('stores')
      .update({ name: storeName })
      .eq('id', storeId);
    
    setIsSavingName(false);
    if (error) {
      alert("Gagal menyimpan nama toko");
    } else {
      alert("Nama toko berhasil diperbarui!");
    }
  };

  const handleToggleOpen = async (newStatus: boolean) => {
    setIsOpen(newStatus); // Optimistic UI update

    if (storeId) {
      const { error } = await supabase
        .from('stores')
        .update({ is_open: newStatus })
        .eq('id', storeId);

      if (error) {
        console.error("Gagal update status:", error);
        setIsOpen(!newStatus); // Revert on error
        alert("Gagal mengubah status toko. Coba lagi.");
      }
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
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
            <div className="space-y-1">
              <Label>Nama Toko</Label>
              <div className="flex gap-2">
                <Input 
                  value={storeName} 
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Nama Toko Anda"
                />
                <Button onClick={handleUpdateStoreName} disabled={isSavingName}>
                  {isSavingName ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Lokasi Saat Ini</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded-md">
                <MapPin className="h-4 w-4" />
                {location
                  ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
                  : "Lokasi belum diatur"}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleUpdateLocation} disabled={isGettingLocation} variant="secondary" className="w-full">
              {isGettingLocation ? "Mendapatkan Lokasi..." : "Update Lokasi dari Perangkat"}
            </Button>
          </CardFooter>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Hari Ini</CardTitle>
            <CardDescription>Statistik singkat penjualan.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 p-4 bg-muted rounded-xl">
              <span className="text-muted-foreground text-sm font-medium">Order Aktif</span>
              <span className="text-3xl font-bold">{activeOrdersCount}</span>
            </div>
            <div className="flex flex-col gap-1 p-4 bg-muted rounded-xl">
              <span className="text-muted-foreground text-sm font-medium">Total Produk</span>
              <span className="text-3xl font-bold">{products.length}</span>
            </div>
            <div className="flex flex-col gap-1 p-4 bg-muted rounded-xl col-span-2">
              <span className="text-muted-foreground text-sm font-medium">Pendapatan Kotor (Selesai)</span>
              <span className="text-2xl font-bold text-green-600">Rp {grossRevenue.toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-5 w-5" />
              Kelola Produk
            </CardTitle>
            <CardDescription>Daftar produk yang Anda jual di etalase.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Produk
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Produk Baru</DialogTitle>
                <DialogDescription>
                  Masukkan detail produk yang ingin Anda jual.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddProduct} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama Produk</Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Gula Pasir 1kg"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Harga (Rp)</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="15000"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Satuan</Label>
                    <Input
                      id="unit"
                      placeholder="Contoh: Pcs, Kg, Ikat"
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Menyimpan..." : "Simpan Produk"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingProducts ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Memuat produk...
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Belum ada produk. Silakan tambah produk pertama Anda.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>Rp {product.price?.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${product.is_available
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                          }`}>
                          {product.is_available ? "Tersedia" : "Habis"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
