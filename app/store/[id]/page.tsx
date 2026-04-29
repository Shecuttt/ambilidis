"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";
import { useCartStore } from "@/lib/store";
import { ArrowLeft, Store, Star, ShoppingBag, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function StoreDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { items, addItem, removeItem, updateQuantity, getTotal, storeId: cartStoreId } = useCartStore();
  const cartTotalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    fetchStoreAndProducts();
  }, [id]);

  const fetchStoreAndProducts = async () => {
    setIsLoading(true);

    // Fetch store
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (storeData) {
      setStore(storeData);

      // Fetch products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', id)
        .eq('is_available', true)
        .order('name');

      if (productsData) setProducts(productsData);
    }

    setIsLoading(false);
  };

  const getProductQuantity = (productId: string) => {
    return items.find(item => item.id === productId)?.quantity || 0;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat toko...</div>;
  }

  if (!store) {
    return <div className="min-h-screen flex items-center justify-center">Toko tidak ditemukan.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1 truncate">
            <h1 className="text-lg font-bold text-gray-900 truncate">{store.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto">
        {/* Store Info Banner */}
        <div className="bg-white p-4 border-b">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1 flex-1">
              <h2 className="font-bold text-xl">{store.name}</h2>
              <p className="text-sm text-gray-500">{store.description || "Toko Sembako Pilihan"}</p>
              <div className="flex items-center gap-4 text-xs font-medium pt-1">
                <span className="flex items-center text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-current mr-1" />
                  4.8 (120+)
                </span>
                <span className={`flex items-center ${store.is_open ? 'text-green-600' : 'text-red-500'}`}>
                  {store.is_open ? 'Buka Sekarang' : 'Tutup'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="p-4 space-y-4">
          <h3 className="font-bold text-lg">Daftar Produk</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground bg-white rounded-xl border border-dashed">
                Belum ada produk tersedia.
              </div>
            ) : (
              products.map((product) => {
                const qty = getProductQuantity(product.id);

                return (
                  <Card key={product.id} className="overflow-hidden border-0 shadow-sm rounded-xl">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        {/* Placeholder for product image */}
                        <ShoppingBag className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-semibold text-gray-900 leading-tight">{product.name}</h4>
                        <div className="text-sm font-bold text-primary">
                          Rp {product.price.toLocaleString('id-ID')} <span className="text-xs text-gray-500 font-normal">/ {product.unit}</span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {qty === 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-full px-4 border-primary text-primary hover:bg-primary/5"
                            onClick={() => addItem(product, store.id)}
                            disabled={!store.is_open}
                          >
                            Tambah
                          </Button>
                        ) : (
                          <div className="flex items-center gap-3 bg-gray-50 rounded-full border p-1">
                            <button
                              className="h-7 w-7 flex items-center justify-center rounded-full bg-white shadow-sm border text-gray-600 hover:bg-gray-50"
                              onClick={() => updateQuantity(product.id, qty - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-bold w-4 text-center">{qty}</span>
                            <button
                              className="h-7 w-7 flex items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary/90"
                              onClick={() => addItem(product, store.id)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Floating Cart Button */}
      {cartTotalItems > 0 && cartStoreId === id && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-linear-to-t from-white via-white to-transparent pb-6">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            <Link href="/checkout">
              <Button className="w-full h-14 rounded-2xl shadow-lg flex items-center justify-between px-6 text-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 px-2 py-1 rounded-lg text-sm font-bold">
                    {cartTotalItems} Item
                  </div>
                  <span className="font-semibold">Checkout</span>
                </div>
                <span className="font-bold">
                  Rp {getTotal().toLocaleString('id-ID')}
                </span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
