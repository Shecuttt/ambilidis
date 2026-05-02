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
          className={`text-2xl transition-colors ${star <= (hovered || value) ? "text-yellow-400" : "text-gray-300"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pesanan Saya</h1>
          <p className="text-muted-foreground">Riwayat pesanan Anda.</p>
        </div>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Pesanan</h3>
            <p className="text-muted-foreground text-center mb-4">
              Anda belum memiliki pesanan. Mulai berbelanja untuk membuat pesanan pertama Anda.
            </p>
            <Link href="/">
              <Button>Mulai Berbelanja</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                    
                    {getStatusBadge(order.status)}

                    {/* Jenis Pembayaran */}
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 font-medium">
                      {order.payment_method === 'cod' ? 'COD' : 'Transfer'}
                    </Badge>

                    {/* Status Pembayaran */}
                    {order.payment_status === 'paid' ? (
                      <Badge className="bg-green-500 text-white border-transparent hover:bg-green-600">
                        Lunas
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Belum Bayar
                      </Badge>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatRp(order.total_price)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Store Info */}
                {order.stores && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Store className="h-4 w-4" />
                    <span>{order.stores.name}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent className="pb-3">
                <div className="space-y-2">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.products?.name}</span>
                      <span className="text-muted-foreground">
                        {formatRp(item.price)}
                      </span>
                    </div>
                  ))}
                </div>

                {order.buyer_note && (
                  <div className="mt-3 p-2 bg-muted rounded text-sm">
                    <strong>Catatan:</strong> {order.buyer_note}
                  </div>
                )}
              </CardContent>

              <CardContent className="pt-0">
                {order.status === 'in_delivery' && (
                  <div className="flex justify-center pb-4">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Pesanan Diterima & Selesai
                    </Button>
                  </div>
                )}

                {order.status === 'completed' && !order.ratings?.rating && (
                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openRatingDialog(order.id)}
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Beri Rating
                    </Button>
                  </div>
                )}

                {order.ratings?.rating && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      <span className="font-semibold">Rating Anda: {order.ratings.rating}/5</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRatingDialog(order.id)}
                    >
                      Ubah
                    </Button>
                  </div>
                )}

                {order.ratings?.complaints && order.ratings.complaints.length > 0 && (
                  <div className="mt-2 p-2 bg-orange-50 rounded text-sm text-orange-800">
                    <strong>Keluhan:</strong> {order.ratings.complaints.join(', ')}
                  </div>
                )}
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
