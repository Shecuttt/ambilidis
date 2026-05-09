"use client"

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, ImagePlus, X, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const UNIT_OPTIONS = [
  "kg", "gram", "ons",
  "ikat", "buah", "pcs",
  "bungkus", "porsi", "liter", "ml", "lusin",
];

const productSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Harga harus lebih dari 0"),
  unit: z.string().min(1, "Satuan wajib diisi"),
  description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface AddProductDialogProps {
  storeId: string | null;
  onProductAdded: (product: any) => void;
}

export function AddProductDialog({ storeId, onProductAdded }: AddProductDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [productPhoto, setProductPhoto] = useState<File | null>(null);
  const [productPhotoPreview, setProductPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      price: "",
      unit: "kg",
      description: "",
    },
  });

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

  const onSubmit = useCallback(async (values: ProductFormValues) => {
    if (!storeId) return;

    setIsSubmitting(true);
    let photoUrl: string | null = null;

    try {
      // 1. Upload foto jika ada
      if (productPhoto) {
        setIsUploadingPhoto(true);
        
        const formData = new FormData();
        formData.append('file', productPhoto);
        formData.append('bucket', 'products');
        formData.append('storeId', storeId);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Gagal upload foto');
        }

        photoUrl = data.url;
        setIsUploadingPhoto(false);
      }

      // 2. Insert product using API
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          name: values.name,
          price: parseInt(values.price),
          unit: values.unit,
          description: values.description,
          is_available: true,
          photo_url: photoUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal menyimpan produk');
      }

      if (result.product) {
        onProductAdded(result.product);
        toast.success("Produk berhasil ditambahkan!");
        reset();
        clearPhoto();
        setIsOpen(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah produk");
    } finally {
      setIsSubmitting(false);
      setIsUploadingPhoto(false);
    }
  }, [storeId, productPhoto, onProductAdded, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        reset();
        clearPhoto();
      }
    }}>
      <DialogTrigger render={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      } />
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Produk Baru</DialogTitle>
          <DialogDescription>Masukkan detail produk yang ingin Anda jual.</DialogDescription>
        </DialogHeader>
        <form onSubmit={(e) => handleSubmit(onSubmit)(e)} className="space-y-4 py-2">
          {/* Foto Produk */}
          <div className="space-y-2">
            <Label>Foto Produk <span className="text-xs text-muted-foreground">(maks. 1 MB)</span></Label>
            {productPhotoPreview ? (
              <div className="relative w-full h-40 rounded-xl overflow-hidden border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={productPhotoPreview} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={clearPhoto}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition"
              >
                <ImagePlus className="h-8 w-8" />
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
            <Label htmlFor="name">Nama Produk</Label>
            <Input
              id="name"
              placeholder="Contoh: Gula Pasir"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
          </div>

          {/* Deskripsi */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Deskripsi <span className="text-xs text-muted-foreground">(Opsional)</span></Label>
            <Textarea
              id="description"
              placeholder="Jelaskan detail produk (merek, kualitas, dll)"
              className="resize-none h-20"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description.message}</p>}
          </div>

          {/* Harga + Satuan */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="price">Harga (Rp)</Label>
              <Input
                id="price"
                type="number"
                placeholder="15000"
                {...register("price")}
              />
              {errors.price && <p className="text-xs text-red-500 font-medium">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Satuan</Label>
              <NativeSelect
                id="unit"
                {...register("unit")}
                className="w-full"
              >
                {UNIT_OPTIONS.map(u => (
                  <NativeSelectOption key={u} value={u}>{u}</NativeSelectOption>
                ))}
              </NativeSelect>
              {errors.unit && <p className="text-xs text-red-500 font-medium">{errors.unit.message}</p>}
            </div>
          </div>

          <DialogFooter className="pt-4">
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
