"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ImagePlus, X, Loader2 } from "lucide-react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const UNIT_OPTIONS = [
  "kg", "gram", "ons",
  "ikat", "buah", "pcs",
  "bungkus", "porsi", "liter", "ml", "lusin",
];

interface AddProductDialogProps {
  storeId: string | null;
  onProductAdded: (product: any) => void;
}

export function AddProductDialog({ storeId, onProductAdded }: AddProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [newProduct, setNewProduct] = useState({ name: "", price: "", unit: "kg" });
  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 1 MB.");
      return;
    }

    setProductPhoto(file);
    setProductPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setProductPhoto(null);
    setProductPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.unit || !storeId) return;

    setIsSubmitting(true);
    let photoUrl: string | null = null;

    try {
      // 1. Upload foto jika ada
      if (productPhoto) {
        setIsUploadingPhoto(true);
        const fileExt = productPhoto.name.split('.').pop();
        const fileName = `${storeId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, productPhoto, { cacheControl: '3600', upsert: false });

        if (uploadError) throw new Error(`Gagal upload foto: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);

        photoUrl = urlData.publicUrl;
        setIsUploadingPhoto(false);
      }

      // 2. Insert product
      const { data, error } = await supabase
        .from('products')
        .insert([{
          store_id: storeId,
          name: newProduct.name,
          price: parseInt(newProduct.price),
          unit: newProduct.unit,
          is_available: true,
          photo_url: photoUrl,
        }])
        .select();

      if (error) throw error;

      if (data) {
        onProductAdded(data[0]);
        toast.success("Produk berhasil ditambahkan!");
        setNewProduct({ name: "", price: "", unit: "kg" });
        clearPhoto();
        setIsOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah produk");
    } finally {
      setIsSubmitting(false);
      setIsUploadingPhoto(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        setNewProduct({ name: "", price: "", unit: "kg" });
        clearPhoto();
      }
    }}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Tambah Produk
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
          <DialogDescription>Masukkan detail produk yang ingin Anda jual.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddProduct} className="space-y-4 py-2">
          {/* Foto Produk */}
          <div className="space-y-2">
            <Label>Foto Produk <span className="text-xs text-muted-foreground">(maks. 1 MB)</span></Label>
            {productPhotoPreview ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productPhotoPreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition"
              >
                <ImagePlus className="h-7 w-7" />
                <span className="text-sm">Pilih Foto</span>
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Nama */}
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Nama Produk</Label>
            <Input
              id="prod-name"
              placeholder="Contoh: Gula Pasir"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              required
            />
          </div>

          {/* Harga + Satuan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Harga (Rp)</Label>
              <Input
                id="prod-price"
                type="number"
                min="0"
                placeholder="15000"
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-unit">Satuan</Label>
              <NativeSelect
                id="prod-unit"
                value={newProduct.unit}
                onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                required
                className="w-full"
              >
                {UNIT_OPTIONS.map(u => (
                  <NativeSelectOption key={u} value={u}>{u}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isUploadingPhoto ? "Mengupload foto..." : "Menyimpan..."}</>
                : "Simpan Produk"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
