"use client";

import { useEffect, useState, use, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import {
  ArrowLeft, Star, ShoppingBag, Plus, Minus,
  MapPin, MessageSquareQuote, Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRp } from "@/lib/utils";
import { formatOperatingHours } from "@/lib/store-utils";
import { Clock } from "lucide-react";

// ── Types ────────────────────────────────────────────────────
interface StoreData {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_open: boolean;
  tagline_today: string | null;
  address: string | null;
  operating_hours: any;
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string;
  photo_url: string | null;
  is_available: boolean;
}

// ── Main Component ───────────────────────────────────────────
export default function StoreDetail({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = use(params);

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart conflict dialog state (Section 4: validasi 1 toko 1 keranjang)
  const [conflictProduct, setConflictProduct] = useState<ProductData | null>(null);

  const { items, addItem, forceAddItem, updateQuantity, getTotal, storeId: cartStoreId } = useCartStore();
  const cartTotalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const getProductQty = useCallback(
    (productId: string) => items.find(i => i.id === productId)?.quantity || 0,
    [items]
  );

  // handleAdd: intercepts conflict from different store
  const handleAdd = (product: ProductData) => {
    if (!store) return;
    const result = addItem(product, store.id);
    if (result === "conflict") {
      setConflictProduct(product);
    }
  };

  const handleForceAdd = () => {
    if (!conflictProduct || !store) return;
    forceAddItem(conflictProduct, store.id);
    setConflictProduct(null);
  };

  useEffect(() => {
    fetchStoreAndProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const fetchStoreAndProducts = async () => {
    setIsLoading(true);

    const { data: storeData } = await supabase
      .from("stores")
      .select("id, name, description, logo_url, banner_url, is_open, tagline_today, address, operating_hours")
      .eq("slug", slug)
      .single();

    if (storeData) {
      setStore(storeData);

      const { data: productsData } = await supabase
        .from("products")
        .select("id, name, description, price, unit, photo_url, is_available")
        .eq("store_id", storeData.id)
        .order("is_available", { ascending: false })
        .order("name");

      if (productsData) setProducts(productsData);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Skeleton className="w-full h-64 rounded-none" />
        <div className="max-w-4xl mx-auto p-4 space-y-4 mt-4">
          <Skeleton className="h-24 w-3/4 rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-3 bg-white rounded-xl border">
              <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2 py-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-500">Toko tidak ditemukan.</p>
          <Button onClick={() => router.back()} variant="outline">Kembali</Button>
        </div>
      </div>
    );
  }

  const availableProducts = products.filter(p => p.is_available);
  const unavailableProducts = products.filter(p => !p.is_available);

  return (
    <div className="min-h-screen bg-gray-50/50 pb-28">

      {/* ── Wide Store Header ── */}
      <div className="relative w-full h-64 bg-gray-300 overflow-hidden">
        {store.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={store.banner_url}
            alt={store.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <ShoppingBag className="h-24 w-24 text-primary/20" />
          </div>
        )}

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

        {/* Store Logo floating over banner */}
        {store.logo_url && (
          <div className="absolute bottom-6 left-5 h-20 w-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white z-10 translate-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.logo_url} alt="Logo" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 bg-black/30 backdrop-blur-sm text-white rounded-full p-2 hover:bg-black/50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Status badge — shadcn Badge */}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          {store.is_open ? (
            <Badge className="bg-green-500 text-white border-transparent gap-1.5 shadow-lg">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Buka
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-700/80 text-white border-transparent backdrop-blur-sm">
              Tutup
            </Badge>
          )}
          {store.operating_hours && (
            <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[10px] text-white/90 flex items-center gap-1 border border-white/10">
              <Clock className="h-3 w-3" />
              {formatOperatingHours(store.operating_hours)}
            </div>
          )}
        </div>

        {/* Store info overlay */}
        <div className={`absolute bottom-0 left-0 right-0 px-5 pb-5 text-white ${store.logo_url ? 'pl-28' : ''}`}>
          <h1 className="text-2xl font-bold drop-shadow-md leading-tight">{store.name}</h1>
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            <span className="flex items-center text-white/80 text-xs">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 mr-1" />
              4.8
            </span>
            {store.address && (
              <span className="flex items-center text-white/70 text-xs gap-1">
                <MapPin className="h-3 w-3" />
                {store.address}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Sapaan Hari Ini ── */}
      {store.tagline_today && (
        <div className="max-w-4xl mx-auto px-4 pt-4">
          <div className="bg-primary/5 border border-primary/10 rounded-2xl px-4 py-3 flex items-start gap-3">
            <MessageSquareQuote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-primary/70 font-medium uppercase tracking-wider mb-0.5">Sapaan Hari Ini</p>
              <p className="text-sm text-gray-800 font-medium italic">"{store.tagline_today}"</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Deskripsi toko ── */}
      {store.description && (
        <div className="max-w-4xl mx-auto px-4 pt-3">
          <p className="text-sm text-gray-500">{store.description}</p>
        </div>
      )}

      {/* ── Product List ── */}
      <div className="max-w-4xl mx-auto px-4 pt-5 space-y-5">
        <h2 className="font-bold text-lg text-gray-900">
          Produk ({availableProducts.length} tersedia)
        </h2>

        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-white rounded-xl border border-dashed">
            Belum ada produk yang ditampilkan.
          </div>
        ) : (
          <div className="space-y-6">

            {/* Available products */}
            {availableProducts.length > 0 && (
              <div className="space-y-3">
                {availableProducts.map(product => {
                  const qty = getProductQty(product.id);
                  return (
                    <AvailableProductRow
                      key={product.id}
                      product={product}
                      qty={qty}
                      storeIsOpen={store.is_open}
                      onAdd={() => handleAdd(product)}
                      onInc={() => updateQuantity(product.id, qty + 1)}
                      onDec={() => updateQuantity(product.id, Math.max(0, qty - 1))}
                    />
                  );
                })}
              </div>
            )}

            {/* Unavailable products — non-interactive */}
            {unavailableProducts.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Stok Habis</p>
                {unavailableProducts.map(product => (
                  <UnavailableProductRow key={product.id} product={product} />
                ))}
              </div>
            )}

          </div>
        )}
      </div>

      {/* ── Floating Cart Button ── */}
      {cartTotalItems > 0 && cartStoreId === store?.id && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-white via-white to-transparent pb-6 z-30">
          <div className="max-w-4xl mx-auto">
            <Link href="/checkout">
              <Button className="w-full h-14 rounded-2xl shadow-lg flex items-center justify-between px-6 text-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold">
                    {cartTotalItems} Item
                  </div>
                  <span className="font-semibold">Checkout</span>
                </div>
                <span className="font-bold">{formatRp(getTotal())}</span>
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Cart Conflict Dialog (Section 4: 1 Toko 1 Keranjang) ── */}
      <Dialog open={!!conflictProduct} onOpenChange={(open) => !open && setConflictProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ganti Toko?</DialogTitle>
            <DialogDescription>
              Keranjangmu berisi produk dari toko lain.
              Menambahkan produk ini akan <strong>menghapus keranjang lama</strong>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConflictProduct(null)}>Batal</Button>
            <Button onClick={handleForceAdd}>Ganti & Tambahkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

// ── Available Product Row ─────────────────────────────────────
function AvailableProductRow({
  product, qty, storeIsOpen, onAdd, onInc, onDec,
}: {
  product: ProductData;
  qty: number;
  storeIsOpen: boolean;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden flex items-center gap-3 pr-4 hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="h-20 w-20 shrink-0 overflow-hidden bg-gray-100">
        {product.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-7 w-7 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-3 space-y-0.5">
        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">{product.name}</p>
        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
        )}
        <div className="text-sm font-bold text-primary">
          {formatRp(product.price)}
          <span className="text-xs text-gray-400 font-normal ml-1">/ {product.unit}</span>
        </div>
      </div>

      {/* Quick add — only if store is open */}
      {storeIsOpen ? (
        <div className="shrink-0">
          {qty === 0 ? (
            <button
              onClick={onAdd}
              className="h-9 w-9 flex items-center justify-center rounded-full bg-primary text-white hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 rounded-full border px-1.5 py-1">
              <button
                onClick={onDec}
                className="h-7 w-7 flex items-center justify-center rounded-full bg-white shadow-sm border text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="text-sm font-bold w-4 text-center text-gray-900">{qty}</span>
              <button
                onClick={onInc}
                className="h-7 w-7 flex items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <Badge variant="outline" className="shrink-0 text-gray-400 border-gray-200">
          Tutup
        </Badge>
      )}
    </div>
  );
}

// ── Unavailable Product Row ───────────────────────────────────
function UnavailableProductRow({ product }: { product: ProductData }) {
  return (
    <div className="bg-white rounded-2xl border overflow-hidden flex items-center gap-3 pr-4 opacity-50 cursor-not-allowed select-none">
      {/* Thumbnail — greyscale */}
      <div className="h-20 w-20 shrink-0 overflow-hidden bg-gray-100 grayscale">
        {product.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.photo_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-7 w-7 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-3 space-y-0.5">
        <p className="font-semibold text-gray-700 text-sm leading-tight line-clamp-1">{product.name}</p>
        {product.description && (
          <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>
        )}
        <div className="text-sm font-medium text-gray-400">
          {formatRp(product.price)}
          <span className="text-xs font-normal ml-1">/ {product.unit}</span>
        </div>
      </div>

      {/* Habis badge — shadcn Badge */}
      <Badge variant="destructive" className="shrink-0 bg-red-50 text-red-500 border-red-100 hover:bg-red-50">
        Habis
      </Badge>
    </div>
  );
}
