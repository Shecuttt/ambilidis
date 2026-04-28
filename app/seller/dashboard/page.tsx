"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Store, Plus, Package } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Dummy initial products
const INITIAL_PRODUCTS = [
  { id: 1, name: "Beras Pandan Wangi", price: 75000, unit: "5kg", status: "Tersedia" },
  { id: 2, name: "Telur Ayam Kampung", price: 3000, unit: "Butir", status: "Tersedia" },
];

export default function SellerDashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // New product form state
  const [newProduct, setNewProduct] = useState({ name: "", price: "", unit: "" });

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

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.unit) return;

    const added = {
      id: Date.now(),
      name: newProduct.name,
      price: parseInt(newProduct.price),
      unit: newProduct.unit,
      status: "Tersedia"
    };

    setProducts([...products, added]);
    setNewProduct({ name: "", price: "", unit: "" });
    setIsDialogOpen(false);
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Seller</h1>
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-muted-foreground" />
          <Label htmlFor="store-status" className="font-medium text-lg cursor-pointer">
            {isOpen ? "Toko Buka" : "Toko Tutup"}
          </Label>
          <Switch 
            id="store-status" 
            checked={isOpen} 
            onCheckedChange={setIsOpen} 
            className="data-[state=checked]:bg-green-500"
          />
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
              <Input defaultValue="Toko Sembako Makmur" readOnly className="bg-muted" />
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
              <span className="text-3xl font-bold">3</span>
            </div>
            <div className="flex flex-col gap-1 p-4 bg-muted rounded-xl">
              <span className="text-muted-foreground text-sm font-medium">Total Produk</span>
              <span className="text-3xl font-bold">{products.length}</span>
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
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
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
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Satuan</Label>
                    <Input 
                      id="unit" 
                      placeholder="Contoh: Pcs, Kg, Ikat" 
                      value={newProduct.unit}
                      onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="pt-4">
                  <Button type="submit">Simpan Produk</Button>
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
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      Belum ada produk. Silakan tambah produk pertama Anda.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>Rp {product.price.toLocaleString('id-ID')}</TableCell>
                      <TableCell>{product.unit}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-primary/10 text-primary">
                          {product.status}
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
