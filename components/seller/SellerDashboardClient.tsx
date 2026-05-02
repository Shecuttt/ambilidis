"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Store, Package, Bell, Settings, Loader2 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { isStoreWithinHours } from "@/lib/store-utils";

// Sub-components
import { DashboardStats } from "@/components/seller/DashboardStats";

interface DashboardStatsProps {
  activeOrdersCount: number;
  productsCount: number;
  grossRevenue: number;
}

interface SellerDashboardClientProps {
  initialUser: any;
  initialStore: any;
  initialStats: DashboardStatsProps;
}

export function SellerDashboardClient({ 
  initialUser, 
  initialStore, 
  initialStats 
}: SellerDashboardClientProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(initialStore?.is_open || false);
  const [storeData, setStoreData] = useState(initialStore);
  const [isLoading, setIsLoading] = useState(false);
  
  // Dashboard stats
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    // Periksa jam operasional saat pertama kali load
    if (storeData?.id && storeData?.operating_hours) {
      checkAndTriggerIsOpen(storeData.id, storeData.operating_hours, storeData.is_open);
    }

    // Real-time updates untuk toggle status toko
    const channel = supabase
      .channel('store-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stores',
          filter: `id=eq.${storeData?.id}`
        },
        (payload) => {
          if (payload.new) {
            setStoreData(payload.new);
            setIsOpen(payload.new.is_open);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeData?.id]);

  const checkAndTriggerIsOpen = async (sid: string, hours: any, currentStatus: boolean) => {
    if (!hours) return;
    const shouldBeOpen = isStoreWithinHours(hours);

    if (shouldBeOpen !== currentStatus) {
      try {
        const res = await fetch('/api/stores', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId: sid, is_open: shouldBeOpen }),
        });
        if (res.ok) setIsOpen(shouldBeOpen);
      } catch (err) {
        console.error("Failed to auto-update store status:", err);
      }
    }
  };

  const handleToggleOpen = async (newStatus: boolean) => {
    const previousStatus = isOpen;
    setIsOpen(newStatus);
    
    try {
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: storeData.id, is_open: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Gagal update status");
      }

      toast.success(newStatus ? "Toko dibuka" : "Toko ditutup");
    } catch (err) {
      setIsOpen(previousStatus);
      toast.error("Gagal mengubah status toko.");
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
    <div className="space-y-8">
      {/* ── Concise Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Halo, {storeData?.name}! 👋</h1>
          <p className="text-muted-foreground text-sm">Berikut adalah ringkasan tokomu hari ini.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border">
          <Store className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="store-status" className="text-sm font-bold cursor-pointer">
            {isOpen ? "Toko Buka" : "Toko Tutup"}
          </Label>
          <Switch
            id="store-status"
            checked={isOpen}
            onCheckedChange={handleToggleOpen}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </div>

      {/* ── Stats ── */}
      <DashboardStats
        activeOrdersCount={stats.activeOrdersCount}
        productsCount={stats.productsCount}
        grossRevenue={stats.grossRevenue}
      />

      {/* ── Navigation Cards ── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/seller/products" className="group">
          <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group-hover:border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{stats.productsCount}</p>
                <p className="text-xs text-muted-foreground">produk</p>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">Kelola Produk</h3>
            <p className="text-sm text-muted-foreground">Tambah, edit, dan kelola stok produk tokomu.</p>
          </div>
        </Link>

        <Link href="/seller/orders" className="group">
          <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group-hover:border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-xl group-hover:bg-orange-200 transition-colors">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-600">{stats.activeOrdersCount}</p>
                <p className="text-xs text-muted-foreground">pesanan aktif</p>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">Cek Pesanan</h3>
            <p className="text-sm text-muted-foreground">Lihat dan kelola pesanan masuk.</p>
          </div>
        </Link>

        <Link href="/seller/settings" className="group">
          <div className="bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all group-hover:border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-purple-600">⚙</p>
                <p className="text-xs text-muted-foreground">pengaturan</p>
              </div>
            </div>
            <h3 className="font-semibold text-lg mb-1">Pengaturan Toko</h3>
            <p className="text-sm text-muted-foreground">Kelola informasi dan preferensi toko.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
