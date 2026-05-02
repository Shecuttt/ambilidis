"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Sub-components
import { ProductTable } from "@/components/seller/ProductTable";
import { AddProductDialog } from "@/components/seller/AddProductDialog";

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  is_available: boolean;
  photo_url: string | null;
}

interface ProductsPageClientProps {
  initialUser: any;
  initialStore: any;
  initialProducts: Product[];
}

export function ProductsPageClient({ 
  initialUser, 
  initialStore, 
  initialProducts 
}: ProductsPageClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [storeData, setStoreData] = useState(initialStore);
  
  // Per-product availability toggling
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  useEffect(() => {
    // Real-time updates untuk products
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `store_id=eq.${storeData?.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setProducts(prev => [payload.new as Product, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProducts(prev => prev.map(p => 
              p.id === payload.new.id ? payload.new as Product : p
            ));
          } else if (payload.eventType === 'DELETE') {
            setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeData?.id]);

  const handleToggleAvailability = async (productId: string, currentStatus: boolean) => {
    setTogglingProductId(productId);
    const newStatus = !currentStatus;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: newStatus } : p));
    const { error } = await supabase.from('products').update({ is_available: newStatus }).eq('id', productId);
    if (error) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, is_available: currentStatus } : p));
      toast.error("Gagal mengupdate stok.");
    }
    setTogglingProductId(null);
  };

  const handleDeleteProduct = async (product: Product) => {
    try {
      // 1. Delete from storage if exists
      if (product.photo_url) {
        const urlParts = product.photo_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `${storeData.id}/${fileName}`;
        
        await supabase.storage
          .from('products')
          .remove([filePath]);
      }

      // 2. Delete from database
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      
      if (error) {
        toast.error("Gagal menghapus produk: " + error.message);
      } else {
        toast.success("Produk berhasil dihapus");
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus produk");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Kelola Produk
          </h1>
          <p className="text-muted-foreground text-sm">Kelola stok dan informasi produk tokomu.</p>
        </div>
        <AddProductDialog 
          storeId={storeData.id} 
          onProductAdded={(p) => setProducts([p, ...products])} 
        />
      </div>
      
      {/* Products Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <ProductTable
          products={products}
          isLoading={false}
          togglingProductId={togglingProductId}
          onToggleAvailability={handleToggleAvailability}
          onDeleteProduct={handleDeleteProduct}
        />
      </div>
    </div>
  );
}
