"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, CheckCircle2, Package, MapPin, Star, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRp } from "@/lib/utils";

// ── Rating complaint options ─────────────────────────────────
const COMPLAINT_OPTIONS = [
  { id: "basi", label: "Produk Basi/Rusak" },
  { id: "salah_item", label: "Salah Item" },
  { id: "kurang_berat", label: "Kurang Berat/Takaran" },
  { id: "terlambat", label: "Terlambat Sampai" },
];

// ── Star Rating Component ─────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`text-2xl transition-colors ${star <= (hovered || value) ? "text-yellow-400" : "text-muted"
            }`}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
        >
          ★
        </button>
      ))}
    </div>
  );
}

interface OrdersPageClientProps {
  initialUser: any;
  initialOrders: any[];
}

export function OrdersPageClient({ initialUser, initialOrders }: OrdersPageClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [isLoading, setIsLoading] = useState(false);

  // Rating dialog state
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [complaint, setComplaint] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Real-time updates untuk orders
  useEffect(() => {
    const channel = supabase
      .channel('buyer-orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${initialUser.id}`
        },
        (payload) => {
          if (payload.new) {
            setOrders(prev => prev.map(o =>
              o.id === payload.new.id ? { ...o, ...payload.new } : o
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialUser.id]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Menunggu" },
      accepted: { color: "bg-blue-100 text-blue-800", icon: CheckCircle2, label: "Diterima" },
      in_delivery: { color: "bg-purple-100 text-purple-800", icon: Package, label: "Dikirim" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle2, label: "Selesai" },
      rejected: { color: "bg-red-100 text-red-800", icon: X, label: "Ditolak" },
      expired: { color: "bg-gray-100 text-gray-800", icon: X, label: "Kadaluarsa" },
    };

    const { color, icon: Icon, label } = variants[status] || variants.pending;

    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) throw new Error('Gagal mengupdate status pesanan');

      setOrders(prev =>
        prev.map(o => o.id === orderId
          ? {
            ...o,
            status: newStatus,
            payment_status: newStatus === 'completed' ? 'paid' : o.payment_status
          }
          : o
        )
      );

      toast.success("Pesanan telah diselesaikan. Terima kasih!");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyelesaikan pesanan.");
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingOrderId || rating === 0) return;

    setIsSubmittingRating(true);

    try {
      // Get order details for rating insertion
      const order = orders.find(o => o.id === ratingOrderId);
      if (!order) throw new Error('Order not found');

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: ratingOrderId,
          rating,
          complaints: complaint ? [complaint] : []
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Gagal menyimpan rating');
      }

      // Update local state
      setOrders(prev => prev.map(o =>
        o.id === ratingOrderId
          ? {
            ...o,
            ratings: {
              rating,
              complaints: complaint ? [complaint] : []
            }
          }
          : o
      ));

      toast.success("Terima kasih! Rating Anda telah disimpan.");

      // Reset dialog
      setRatingOrderId(null);
      setRating(0);
      setComplaint("");
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Gagal menyimpan rating. Silakan coba lagi.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const openRatingDialog = (orderId: string) => {
    setRatingOrderId(orderId);
    // Pre-fill existing rating if any
    const order = orders.find(o => o.id === orderId);
    if (order && order.ratings) {
      setRating(order.ratings.rating || 0);
      setComplaint(order.ratings.complaints?.join(', ') || "");
    } else {
      setRating(0);
      setComplaint("");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12 px-4 sm:px-6 pt-4 sm:pt-8 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 sm:h-12 sm:w-12 bg-muted/20 sm:bg-transparent">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="space-y-0.5">
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground/90">Pesanan Saya</h1>
          <p className="text-muted-foreground text-[10px] sm:text-sm font-bold uppercase tracking-widest opacity-60">Riwayat transaksi belanja Anda</p>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Belum Ada Pesanan</h3>
            <p className="text-muted-foreground text-center max-w-xs mb-8">
              Anda belum memiliki pesanan. Mulai berbelanja untuk membuat pesanan pertama Anda.
            </p>
            <Link href="/discovery">
              <Button className="rounded-xl px-8 h-12">Mulai Berbelanja</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-muted-foreground/10">
              <div className="bg-muted/30 px-4 py-3 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-lg">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-bold text-sm">{order.stores?.name}</span>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                  #{order.id.slice(-8)}
                </div>
              </div>

              <CardHeader className="pb-3 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(order.status)}
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">
                      {order.payment_method === 'cod' ? 'COD' : 'Transfer'}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-primary">{formatRp(order.total_price)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-0.5">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    {order.order_items?.slice(0, 2).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm items-center py-1 border-b border-muted last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-bold">{item.quantity}x</span>
                          <span className="font-medium text-foreground/80">{item.products?.name}</span>
                        </div>
                        <span className="text-muted-foreground text-xs tabular-nums">
                          {formatRp(item.price)}
                        </span>
                      </div>
                    ))}
                    {order.order_items?.length > 2 && (
                      <p className="text-[10px] text-muted-foreground italic mt-2">
                        +{order.order_items.length - 2} produk lainnya...
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Link href={`/orders/${order.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full rounded-xl h-10 border-primary/20 text-primary hover:bg-primary/5">
                        Detail Pesanan
                      </Button>
                    </Link>

                    {order.status === 'in_delivery' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        className="flex-1 rounded-xl h-10 bg-green-600 hover:bg-green-700 shadow-md shadow-green-200"
                      >
                        Selesaikan
                      </Button>
                    )}

                    {order.status === 'completed' && !order.ratings?.rating && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openRatingDialog(order.id)}
                        className="flex-1 rounded-xl h-10"
                      >
                        <Star className="h-4 w-4 mr-2 text-yellow-500 fill-yellow-500" />
                        Beri Rating
                      </Button>
                    )}
                  </div>

                  {order.ratings?.rating && (
                    <div className="flex items-center justify-between p-2.5 bg-yellow-50/50 rounded-xl border border-yellow-100">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-[11px] text-yellow-900">Rating: {order.ratings.rating}/5</span>
                      </div>
                      <button
                        onClick={() => openRatingDialog(order.id)}
                        className="text-[10px] font-bold text-yellow-700 hover:underline"
                      >
                        Ubah
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rating Dialog */}
      <Dialog open={!!ratingOrderId} onOpenChange={() => setRatingOrderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beri Rating Pesanan</DialogTitle>
            <DialogDescription>
              Bagaimana pengalaman Anda dengan pesanan ini?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-center">
              <StarRating value={rating} onChange={setRating} />
            </div>

            {rating <= 3 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Apa yang bisa kami perbaiki?</label>
                <div className="space-y-2">
                  {COMPLAINT_OPTIONS.map((option) => (
                    <label key={option.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="complaint"
                        value={option.id}
                        checked={complaint === option.id}
                        onChange={(e) => setComplaint(e.target.value)}
                        className="text-primary"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRatingOrderId(null)}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={isSubmittingRating || rating === 0}
            >
              {isSubmittingRating ? "Menyimpan..." : "Simpan Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
