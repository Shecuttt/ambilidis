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
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="p-1 transition-transform active:scale-90"
        >
          <Star
            className={`h-9 w-9 transition-colors ${
              star <= (hovered || value)
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-100 text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Rating label helper ───────────────────────────────────────
const RATING_LABELS: Record<number, string> = {
  1: "Sangat Buruk 😤",
  2: "Kurang Memuaskan 😕",
  3: "Cukup 😐",
  4: "Bagus 😊",
  5: "Sempurna! 🤩",
};

// ── Main Component ────────────────────────────────────────────
export default function BuyerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Rating dialog state
  const [ratingOrder, setRatingOrder] = useState<any | null>(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComplaints, setRatingComplaints] = useState<string[]>([]);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratedOrderIds, setRatedOrderIds] = useState<Set<string>>(new Set());

  // Cancel dialog state
  const [cancelingOrder, setCancelingOrder] = useState<any | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }
    setCurrentUserId(user.id);

    const { data: ordersData, error } = await supabase
      .from("orders")
      .select(`
        id,
        total_price,
        status,
        created_at,
        payment_method,
        buyer_note,
        rejection_reason,
        stores (id, name),
        order_items (
          id, quantity, price,
          products (name, unit)
        )
      `)
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && ordersData) {
      setOrders(ordersData);
      // Check which orders already have ratings
      const completedIds = ordersData
        .filter(o => o.status === "completed")
        .map(o => o.id);

      if (completedIds.length > 0) {
        const { data: existingRatings } = await supabase
          .from("ratings")
          .select("order_id")
          .in("order_id", completedIds);

        if (existingRatings) {
          setRatedOrderIds(new Set(existingRatings.map(r => r.order_id)));
        }
      }
    }

    setIsLoading(false);
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      if (!response.ok) throw new Error("Gagal mengupdate pesanan");
      
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      return true;
    } catch (err) {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
      return false;
    }
  };

  // ── Confirm received + trigger rating prompt ──────────────────
  const handleConfirmReceived = async (order: any) => {
    const success = await handleUpdateStatus(order.id, "completed");
    if (success) {
      toast.success("Pesanan selesai! Terima kasih.");
      // Open rating dialog
      setRatingOrder(order);
      setRatingValue(0);
      setRatingComplaints([]);
    }
  };

  // ── Submit rating ─────────────────────────────────────────────
  const handleSubmitRating = async () => {
    if (!ratingOrder || ratingValue === 0) return;
    setIsSubmittingRating(true);

    const { error } = await supabase.from("ratings").insert({
      order_id: ratingOrder.id,
      store_id: ratingOrder.stores?.id,
      buyer_id: currentUserId,
      rating: ratingValue,
      complaints: ratingComplaints.length > 0 ? ratingComplaints : null,
    });

    if (!error) {
      setRatedOrderIds(prev => {
        const next = new Set(prev);
        next.add(ratingOrder.id);
        return next;
      });
      toast.success("Ulasan berhasil dikirim!");
    } else {
      toast.error("Gagal mengirim ulasan.");
    }

    setIsSubmittingRating(false);
    setRatingOrder(null);
  };

  const toggleComplaint = (id: string) => {
    setRatingComplaints(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleCancelOrder = async () => {
    if (!cancelingOrder) return;
    setIsCanceling(true);
    const success = await handleUpdateStatus(cancelingOrder.id, "canceled");
    if (success) {
      toast.success("Pesanan berhasil dibatalkan");
      setCancelingOrder(null);
    }
    setIsCanceling(false);
  };

  // ── Loading ───────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-12 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex-1">Pesanan Saya</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Belum Ada Pesanan</h2>
            <p className="text-gray-500 mb-6">Mulai belanja kebutuhanmu dari toko terdekat.</p>
            <Link href="/"><Button size="lg" className="rounded-xl">Cari Toko</Button></Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                alreadyRated={ratedOrderIds.has(order.id)}
                onConfirmReceived={() => handleConfirmReceived(order)}
                onCancelOrder={() => setCancelingOrder(order)}
                onOpenRating={() => {
                  setRatingOrder(order);
                  setRatingValue(0);
                  setRatingComplaints([]);
                }}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Rating Dialog ── */}
      <Dialog open={!!ratingOrder} onOpenChange={(open) => !open && setRatingOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
              Beri Ulasan
            </DialogTitle>
            <DialogDescription>
              Bagaimana pengalamanmu berbelanja di{" "}
              <strong>{ratingOrder?.stores?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Stars */}
            <div className="flex flex-col items-center gap-2">
              <StarRating value={ratingValue} onChange={setRatingValue} />
              {ratingValue > 0 && (
                <span className="text-sm font-semibold text-amber-600 animate-in fade-in">
                  {RATING_LABELS[ratingValue]}
                </span>
              )}
            </div>

            {/* Complaints — only show if rating ≤ 3 */}
            {ratingValue > 0 && ratingValue <= 3 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ada masalah? (opsional)
                </p>
                <div className="flex flex-wrap gap-2">
                  {COMPLAINT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleComplaint(opt.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${
                        ratingComplaints.includes(opt.id)
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-red-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-1 flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRatingOrder(null)}
              disabled={isSubmittingRating}
            >
              Lewati
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitRating}
              disabled={ratingValue === 0 || isSubmittingRating}
            >
              {isSubmittingRating ? "Mengirim..." : "Kirim Ulasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Cancel Confirmation Dialog ── */}
      <Dialog open={!!cancelingOrder} onOpenChange={(open) => !open && setCancelingOrder(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Batalkan Pesanan?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pesanan akan langsung dihentikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-row">
            <Button variant="outline" className="flex-1" onClick={() => setCancelingOrder(null)} disabled={isCanceling}>
              Tidak, Kembali
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleCancelOrder} disabled={isCanceling}>
              {isCanceling ? "Membatalkan..." : "Ya, Batalkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Order Card ────────────────────────────────────────────────
function OrderCard({
  order, alreadyRated, onConfirmReceived, onOpenRating, onCancelOrder
}: {
  order: any;
  alreadyRated: boolean;
  onConfirmReceived: () => void;
  onOpenRating: () => void;
  onCancelOrder: () => void;
}) {
  const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    pending:     { label: "Menunggu Konfirmasi",       className: "bg-amber-50 text-amber-700 border-amber-100",    icon: <Clock className="h-4 w-4 text-amber-500" /> },
    accepted:    { label: "Sedang Disiapkan Seller",   className: "bg-blue-50 text-blue-700 border-blue-100",       icon: <Package className="h-4 w-4 text-blue-500" /> },
    in_delivery: { label: "Kurir Sedang Mengantar",    className: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: <MapPin className="h-4 w-4 text-indigo-500 animate-pulse" /> },
    completed:   { label: "Pesanan Selesai",           className: "bg-green-50 text-green-700 border-green-100",    icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
    rejected:    { label: "Ditolak Seller",            className: "bg-red-50 text-red-700 border-red-100",          icon: <X className="h-4 w-4 text-red-500" /> },
    canceled:    { label: "Dibatalkan Pembeli",        className: "bg-gray-50 text-gray-600 border-gray-100",       icon: <X className="h-4 w-4 text-gray-500" /> },
    expired:     { label: "Dibatalkan Otomatis",       className: "bg-gray-50 text-gray-600 border-gray-100",       icon: <Clock className="h-4 w-4 text-gray-400" /> },
  };

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.canceled;

  return (
    <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
      <CardHeader className="py-3 bg-white border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            {order.stores?.name || "Toko"}
          </CardTitle>
          <span className="text-xs text-gray-400">
            {new Date(order.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4 bg-white">
        {/* Status badge */}
        <Badge variant="outline" className={`flex items-center gap-2 px-3 py-2 h-auto justify-start text-sm font-semibold rounded-xl ${cfg.className}`}>
          {cfg.icon}
          {cfg.label}
        </Badge>

        {/* Rejection reason */}
        {order.status === "rejected" && order.rejection_reason && (
          <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
            Alasan: {order.rejection_reason}
          </p>
        )}

        {/* Buyer note */}
        {order.buyer_note && (
          <p className="text-xs text-gray-500 italic bg-gray-50 px-3 py-2 rounded-lg border">
            Catatan: "{order.buyer_note}"
          </p>
        )}

        {/* Items */}
        <div className="space-y-1.5">
          {order.order_items.map((item: any) => (
            <div key={item.id} className="text-sm flex justify-between text-gray-600">
              <span className="truncate pr-4">
                <span className="font-semibold text-gray-900">{item.quantity}×</span>{" "}
                {item.products?.name}
              </span>
              <span className="shrink-0">{formatRp(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t flex justify-between items-center">
          <span className="text-sm text-gray-500 font-medium">Total</span>
          <span className="font-bold text-primary">{formatRp(order.total_price)}</span>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Cancel (COD pending only) */}
          {order.status === "pending" && order.payment_method === "cod" && (
            <Button
              variant="outline"
              className="w-full text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
              onClick={onCancelOrder}
            >
              Batalkan Pesanan
            </Button>
          )}

          {/* Confirm received */}
          {order.status === "in_delivery" && (
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl"
              onClick={onConfirmReceived}
            >
              Konfirmasi Pesanan Diterima
            </Button>
          )}

          {/* Rating prompt — only for completed, not yet rated */}
          {order.status === "completed" && !alreadyRated && (
            <Button
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50 rounded-xl"
              onClick={onOpenRating}
            >
              <Star className="h-4 w-4 mr-2 fill-amber-400 text-amber-400" />
              Beri Ulasan
            </Button>
          )}

          {/* Already rated */}
          {order.status === "completed" && alreadyRated && (
            <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
              Sudah diberi ulasan
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
