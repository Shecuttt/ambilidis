"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatRp } from "@/lib/utils";

// Utility for countdown
function getRemainingMinutes(createdAt: string) {
  const orderTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffMs = orderTime + 15 * 60 * 1000 - now; // 15 minutes
  return Math.max(0, Math.floor(diffMs / 1000 / 60));
}

const formatSeparatorDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (target.getTime() === today.getTime()) return "Hari Ini";
  if (target.getTime() === yesterday.getTime()) return "Kemarin";
  
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const REJECTION_REASONS = [
  { value: "stok_habis", label: "Stok Habis" },
  { value: "di_luar_jam", label: "Di Luar Jam Operasional" },
  { value: "lainnya", label: "Lainnya" },
];

export default function SellerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [storeId, setStoreId] = useState<string | null>(null);

  // Rejection dialog state
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState<string>("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Auto update countdown every minute
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: string, rejectionReason?: string) => {
    try {
      const body: Record<string, string> = { orderId, status: newStatus };
      if (rejectionReason) body.rejectionReason = rejectionReason;

      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Gagal dari server');

      setOrders(prev =>
        prev.map(o => o.id === orderId
          ? { ...o, status: newStatus, rejection_reason: rejectionReason || o.rejection_reason }
          : o
        )
      );

      // Toast success message based on status
      const statusLabels: Record<string, string> = {
        accepted: "Pesanan diterima",
        in_delivery: "Pesanan dikirim",
        rejected: "Pesanan ditolak",
        completed: "Pesanan selesai"
      };
      if (statusLabels[newStatus]) toast.success(statusLabels[newStatus]);

    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate status pesanan.");
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-expire COD orders that timed out — run after orders load
  useEffect(() => {
    if (orders.length === 0) return;
    orders.forEach(order => {
      if (order.status === 'pending' && order.payment_method !== 'transfer') {
        const remaining = getRemainingMinutes(order.created_at);
        if (remaining <= 0) {
          handleUpdateStatus(order.id, 'expired');
        }
      }
      // Auto-complete if 24h passed since in_delivery
      if (order.status === 'in_delivery' && order.updated_at) {
        const deliveryHours = (Date.now() - new Date(order.updated_at).getTime()) / 1000 / 3600;
        if (deliveryHours >= 24) {
          handleUpdateStatus(order.id, 'completed');
        }
      }
    });
  }, [orders, handleUpdateStatus]);

  const fetchOrders = async () => {
    setIsLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: storeData } = await supabase
      .from('stores')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1);

    if (storeData && storeData.length > 0) {
      const sId = storeData[0].id;
      setStoreId(sId);

      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_price,
          status,
          created_at,
          updated_at,
          payment_method,
          payment_status,
          buyer_note,
          rejection_reason,
          order_items (
            id,
            quantity,
            price,
            products (name, unit)
          )
        `)
        .eq('store_id', sId)
        .order('created_at', { ascending: false });

      if (!error && ordersData) {
        setOrders(ordersData);
      }
    }

    setIsLoading(false);
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus }),
      });

      if (!response.ok) throw new Error('Gagal dari server');

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: paymentStatus } : o));
      toast.success("Pembayaran berhasil dicatat");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate status pembayaran.");
    }
  };

  // Called when seller taps "Tolak" — opens dialog first
  const openRejectDialog = (orderId: string) => {
    setRejectingOrderId(orderId);
    setSelectedReason("");
    setOtherReason("");
  };

  const closeRejectDialog = () => {
    setRejectingOrderId(null);
    setSelectedReason("");
    setOtherReason("");
    setIsRejecting(false);
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrderId || !selectedReason) return;

    const finalReason = selectedReason === "lainnya"
      ? (otherReason.trim() || "Lainnya")
      : REJECTION_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;

    setIsRejecting(true);
    await handleUpdateStatus(rejectingOrderId, 'rejected', finalReason);
    closeRejectDialog();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="space-y-4">
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
    <>
      {/* ── Rejection Reason Dialog ── */}
      <Dialog open={!!rejectingOrderId} onOpenChange={(open) => !open && closeRejectDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alasan Penolakan
            </DialogTitle>
            <DialogDescription>
              Pilih alasan penolakan agar buyer memahami situasinya.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            {REJECTION_REASONS.map(reason => (
              <button
                key={reason.value}
                type="button"
                onClick={() => setSelectedReason(reason.value)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all
                  ${selectedReason === reason.value
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
              >
                {reason.label}
              </button>
            ))}

            {selectedReason === "lainnya" && (
              <Textarea
                placeholder="Tuliskan alasan lainnya..."
                value={otherReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOtherReason(e.target.value)}
                className="resize-none mt-2"
                rows={3}
                maxLength={150}
              />
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeRejectDialog} disabled={isRejecting}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={!selectedReason || isRejecting}
            >
              {isRejecting ? "Menolak..." : "Konfirmasi Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Main Page ── */}
      <div className="container mx-auto max-w-3xl p-4 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/seller/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Pesanan Masuk</h1>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed">
              Belum ada pesanan yang masuk.
            </div>
          ) : (
            orders.map((order, index) => {
              const currentDate = new Date(order.created_at).toDateString();
              const prevDate = index > 0 ? new Date(orders[index - 1].created_at).toDateString() : null;
              const showSeparator = currentDate !== prevDate;
              const isPending = order.status === 'pending';
              const remainingMins = getRemainingMinutes(order.created_at);
              const isExpired = isPending && remainingMins <= 0;
              const isTransfer = order.payment_method === 'transfer';
              const isPaid = order.payment_status === 'paid';

              // Status styles mapping
              const statusStyles: Record<string, string> = {
                pending: "bg-amber-50 text-amber-700 border-amber-200",
                accepted: "bg-blue-50 text-blue-700 border-blue-200",
                in_delivery: "bg-indigo-50 text-indigo-700 border-indigo-200",
                completed: "bg-green-50 text-green-700 border-green-200",
                rejected: "bg-red-50 text-red-700 border-red-200",
                expired: "bg-gray-100 text-gray-600 border-gray-200",
              };

              return (
                <div key={order.id} className="space-y-4">
                  {showSeparator && (
                    <div className="pt-4 pb-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider sticky top-[72px] bg-gray-50/80 backdrop-blur-xs py-1 px-2 rounded-md w-fit">
                        {formatSeparatorDate(order.created_at)}
                      </h3>
                    </div>
                  )}
                  <Card className="overflow-hidden border shadow-sm">
                  {/* ── Card Header ── */}
                  <CardHeader className={`py-3 ${statusStyles[order.status]?.split(' ')[0] || 'bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2 flex-wrap">
                        <Package className="h-4 w-4" />
                        ID: {order.id.slice(0, 8).toUpperCase()}
                        <Badge variant="outline" className={`font-bold border ${isTransfer ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                          {isTransfer ? 'TRANSFER' : 'COD'}
                        </Badge>
                        <Badge variant="outline" className={`font-bold border ${isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                          {isPaid ? 'LUNAS' : 'BELUM BAYAR'}
                        </Badge>
                      </CardTitle>
                      <Badge className={`font-bold ${statusStyles[order.status]}`}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* ── Card Body ── */}
                  <CardContent className="p-4 space-y-4 bg-white">
                    <div className="divide-y text-sm">
                      {order.order_items.map((item: any) => (
                        <div key={item.id} className="py-2 flex justify-between">
                          <div>
                            <span className="font-semibold">{item.quantity}x</span>{" "}
                            {item.products?.name}
                            {item.products?.unit && (
                              <span className="text-gray-400 ml-1">/{item.products.unit}</span>
                            )}
                          </div>
                          <span className="text-gray-500">{formatRp(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Buyer note */}
                    {order.buyer_note && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-sm">
                        <span className="text-amber-700 font-semibold">📝 Catatan buyer: </span>
                        <span className="text-amber-900">{order.buyer_note}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-start pt-2 border-t font-bold">
                      <span>Total Pembayaran</span>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-primary text-lg">{formatRp(order.total_price)}</span>
                        {!isPaid && !isTransfer && (order.status === 'in_delivery' || order.status === 'completed') && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs border-green-500 text-green-600 hover:bg-green-50"
                            onClick={() => handleUpdatePaymentStatus(order.id, 'paid')}
                          >
                            Tandai Lunas
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Rejection reason (if rejected) */}
                    {order.status === 'rejected' && order.rejection_reason && (
                      <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-sm">
                        <span className="text-red-700 font-semibold">❌ Alasan penolakan: </span>
                        <span className="text-red-900">{order.rejection_reason}</span>
                      </div>
                    )}
                  </CardContent>

                  {/* ── Footer: Action Buttons ── */}
                  {isPending && (
                    <CardFooter className="bg-gray-50 p-4 flex flex-col gap-3">
                      {isTransfer ? (
                        <div className="w-full flex flex-col gap-2">
                          {isPaid ? (
                            <>
                              <div className="text-green-600 text-sm font-semibold flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Pembeli sudah membayar lunas. Segera proses!
                              </div>
                              <div className="flex gap-3 w-full">
                                <Button
                                  variant="outline"
                                  className="w-1/2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  onClick={() => openRejectDialog(order.id)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Tolak
                                </Button>
                                <Button
                                  className="w-1/2 bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Terima Order
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="text-amber-600 text-sm font-semibold flex items-center gap-2">
                              <Clock className="h-4 w-4" /> Menunggu pembeli menyelesaikan pembayaran.
                            </div>
                          )}
                        </div>
                      ) : (
                        !isExpired ? (
                          <>
                            <div className="w-full flex items-center justify-center gap-2 text-amber-600 text-sm font-semibold">
                              <Clock className="h-4 w-4" />
                              Segera konfirmasi! Waktu tersisa: {remainingMins} menit
                            </div>
                            <div className="flex gap-3 w-full">
                              <Button
                                variant="outline"
                                className="w-1/2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                onClick={() => openRejectDialog(order.id)}
                              >
                                <XCircle className="mr-2 h-4 w-4" /> Tolak
                              </Button>
                              <Button
                                className="w-1/2 bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleUpdateStatus(order.id, 'accepted')}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Terima Order
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="w-full flex items-center justify-center gap-2 text-red-600 text-sm font-semibold">
                            Waktu konfirmasi habis. Pesanan dibatalkan otomatis.
                          </div>
                        )
                      )}
                    </CardFooter>
                  )}

                  {order.status === 'accepted' && (
                    <CardFooter className="bg-gray-50 p-4">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleUpdateStatus(order.id, 'in_delivery')}
                      >
                        <Package className="mr-2 h-4 w-4" /> Pesanan Siap & Kirim ke Kurir
                      </Button>
                    </CardFooter>
                  )}

                  {order.status === 'in_delivery' && (
                    <CardFooter className="bg-gray-50 p-4 flex justify-center text-center">
                      <p className="text-sm text-gray-500 font-medium flex flex-col items-center gap-1">
                        <Clock className="h-4 w-4 text-indigo-400 mb-1" />
                        Menunggu Buyer untuk mengkonfirmasi pesanan diterima.<br />
                        (Akan otomatis selesai dalam 24 Jam)
                      </p>
                    </CardFooter>
                  )}
                  </Card>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
