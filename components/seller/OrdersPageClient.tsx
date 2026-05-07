"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Package, AlertTriangle, CheckSquare, MapPin, User, Receipt } from "lucide-react";
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
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";

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

interface OrdersPageClientProps {
  initialUser: any;
  initialStore: any;
  initialOrders: any[];
}

export function OrdersPageClient({
  initialUser,
  initialStore,
  initialOrders
}: OrdersPageClientProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [storeId, setStoreId] = useState(initialStore?.id || null);

  // New States
  const [activeFilter, setActiveFilter] = useState<string>("pending");
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);

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

  // Real-time updates untuk orders
  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        async (payload) => {
          if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o =>
              o.id === payload.new.id ? { ...o, ...payload.new } : o
            ));
          } else if (payload.eventType === 'INSERT') {
            const { data: fullOrder } = await supabase
              .from('orders')
              .select(`
                id, total_price, status, created_at, updated_at,
                payment_method, payment_status, buyer_note, rejection_reason,
                order_items (
                  id, quantity, price,
                  products (name, unit)
                ),
                profiles!orders_buyer_id_fkey (
                  address,
                  full_name,
                  phone
                )
              `)
              .eq('id', payload.new.id)
              .single();

            if (fullOrder) {
              setOrders(prev => [fullOrder, ...prev]);
              toast.info("Ada pesanan baru masuk!");
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

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

      const statusLabels: Record<string, string> = {
        accepted: "Pesanan diterima",
        in_delivery: "Pesanan dikirim",
        rejected: "Pesanan ditolak",
        completed: "Pesanan selesai",
        expired: "Pesanan kadaluarsa"
      };
      if (statusLabels[newStatus]) toast.success(statusLabels[newStatus]);

    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate status pesanan.");
    }
  }, []);

  const handleBulkAccept = async () => {
    if (selectedOrderIds.length === 0) return;

    setIsBulkProcessing(true);
    try {
      const results = await Promise.all(
        selectedOrderIds.map(id =>
          fetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: id, status: 'accepted' }),
          })
        )
      );

      const failedCount = results.filter(res => !res.ok).length;

      if (failedCount === 0) {
        toast.success(`${selectedOrderIds.length} pesanan berhasil diterima`);
        setOrders(prev => prev.map(o =>
          selectedOrderIds.includes(o.id) ? { ...o, status: 'accepted' } : o
        ));
      } else {
        toast.warning(`${selectedOrderIds.length - failedCount} berhasil, ${failedCount} gagal`);
      }
      setSelectedOrderIds([]);
    } catch (error) {
      toast.error("Gagal memproses pesanan massal");
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleUpdatePaymentStatus = useCallback(async (orderId: string, newPaymentStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus: newPaymentStatus }),
      });

      if (!response.ok) throw new Error('Gagal mengupdate status pembayaran');

      setOrders(prev =>
        prev.map(o => o.id === orderId
          ? { ...o, payment_status: newPaymentStatus }
          : o
        )
      );

      toast.success("Status pembayaran diperbarui");
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate status pembayaran.");
    }
  }, []);

  // Auto-expire COD orders
  useEffect(() => {
    if (orders.length === 0) return;
    orders.forEach(order => {
      if (order.status === 'pending' && order.payment_method !== 'transfer') {
        const remaining = getRemainingMinutes(order.created_at);
        if (remaining <= 0) {
          handleUpdateStatus(order.id, 'expired');
        }
      }
      if (order.status === 'in_delivery' && order.updated_at) {
        const deliveryHours = (Date.now() - new Date(order.updated_at).getTime()) / 1000 / 3600;
        if (deliveryHours >= 24) {
          handleUpdateStatus(order.id, 'completed');
        }
      }
    });
  }, [orders, handleUpdateStatus]);

  const handleReject = async () => {
    if (!rejectingOrderId || (!selectedReason && !otherReason)) return;

    setIsRejecting(true);
    const reason = selectedReason === 'lainnya' ? otherReason : selectedReason;
    await handleUpdateStatus(rejectingOrderId, 'rejected', reason);
    setRejectingOrderId(null);
    setSelectedReason("");
    setOtherReason("");
    setIsRejecting(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Menunggu" },
      accepted: { color: "bg-blue-100 text-blue-800", icon: CheckCircle2, label: "Diterima" },
      in_delivery: { color: "bg-purple-100 text-purple-800", icon: Package, label: "Dikirim" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle2, label: "Selesai" },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Ditolak" },
      expired: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Kadaluarsa" },
    };

    const { color, icon: Icon, label } = variants[status] || variants.pending;
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  const groupOrdersByDate = (orders: any[]) => {
    const filteredOrders = orders.filter(o => {
      if (activeFilter === "all") return true;
      if (activeFilter === "pending") return o.status === "pending";
      if (activeFilter === "process") return ["accepted", "in_delivery"].includes(o.status);
      if (activeFilter === "done") return ["completed", "rejected", "expired"].includes(o.status);
      return true;
    });

    const grouped: Record<string, any[]> = {};
    filteredOrders.forEach(order => {
      const dateKey = formatSeparatorDate(order.created_at);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(order);
    });

    return grouped;
  };

  const toggleOrderSelection = (id: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-6 w-32" />
        </div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  const groupedOrders = groupOrdersByDate(orders);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/seller/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pesanan</h1>
            <p className="text-muted-foreground text-sm">Kelola pesanan masuk tokomu.</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { id: "all", label: "Semua", count: orders.length },
            { id: "pending", label: "Menunggu", count: pendingOrdersCount },
            { id: "process", label: "Diproses", count: orders.filter(o => ["accepted", "in_delivery"].includes(o.status)).length },
            { id: "done", label: "Selesai", count: orders.filter(o => ["completed", "rejected", "expired"].includes(o.status)).length },
          ].map(f => (
            <Button
              key={f.id}
              variant={activeFilter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(f.id)}
              className="rounded-full whitespace-nowrap"
            >
              {f.label}
              {f.count > 0 && <span className="ml-1.5 opacity-70">({f.count})</span>}
            </Button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrderIds.length > 1 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-lg">
          <div className="bg-primary text-primary-foreground p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckSquare className="h-5 w-5" />
              </div>
              <span className="font-semibold">{selectedOrderIds.length} terpilih</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10"
                onClick={() => setSelectedOrderIds([])}
              >
                Batal
              </Button>
              <Button
                size="sm"
                className="bg-white text-primary hover:bg-white/90"
                onClick={handleBulkAccept}
                disabled={isBulkProcessing}
              >
                {isBulkProcessing ? "Memproses..." : "Terima Semua"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {Object.keys(groupedOrders).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 bg-muted rounded-full mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Pesanan</h3>
            <p className="text-muted-foreground text-center max-w-xs">
              Pesanan dengan status ini belum tersedia saat ini.
            </p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedOrders).map(([date, dateOrders]) => (
          <div key={date} className="space-y-4">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">
              {date}
            </h2>
            <div className="grid gap-4">
              {dateOrders.map((order) => {
                const isSelected = selectedOrderIds.includes(order.id);
                const isSelectable = order.status === 'pending';

                return (
                  <Card
                    key={order.id}
                    className={`overflow-hidden transition-all duration-200 border-2 ${isSelected ? "border-primary shadow-md ring-2 ring-primary/10" : "border-transparent"
                      }`}
                  >
                    <div className="flex">
                      {isSelectable && (
                        <div
                          className={`w-12 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors border-r ${isSelected ? "bg-primary/5" : ""
                            }`}
                          onClick={() => toggleOrderSelection(order.id)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                            className="h-5 w-5"
                          />
                        </div>
                      )}

                      <div className="flex-1">
                        <CardHeader className="pb-3 pt-4 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">
                                #{order.id.slice(-8)}
                              </span>
                              {getStatusBadge(order.status)}
                              <Badge
                                variant={order.payment_method === 'cod' ? 'secondary' : 'outline'}
                                className="text-[10px] uppercase font-bold tracking-tight"
                              >
                                {order.payment_method === 'cod' ? 'COD' : 'Transfer'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-primary">{formatRp(order.total_price)}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="pb-4 px-4">
                          <div className="space-y-2">
                            {order.order_items?.map((item: any) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span className="font-medium">{item.quantity}x {item.products?.name}</span>
                                <span className="text-muted-foreground tabular-nums">
                                  {formatRp(item.price)}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.buyer_note && (
                            <div className="mt-3 p-2 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-900">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <AlertTriangle className="h-3 w-3" />
                                <strong className="font-bold">Catatan Pembeli:</strong>
                              </div>
                              {order.buyer_note}
                            </div>
                          )}

                          {/* Buyer Address & Info Section */}
                          <div className="mt-4 pt-4 border-t border-dashed space-y-3">
                            <div className="flex items-start gap-2 text-xs">
                              <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-bold block text-[10px] uppercase tracking-wider text-muted-foreground">Alamat Pengiriman</span>
                                <p className="text-foreground leading-relaxed font-medium">
                                  {order.profiles?.address || 'Alamat tidak tersedia'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] bg-muted/30 p-2 rounded-lg border">
                              <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                  {order.profiles?.full_name?.charAt(0) || order.profiles?.phone?.charAt(0) || 'B'}
                                </div>
                                <span className="font-semibold">{order.profiles?.full_name || 'Pembeli'}</span>
                              </div>
                              <span className="text-muted-foreground tabular-nums">{order.profiles?.phone || '-'}</span>
                            </div>
                          </div>
                        </CardContent>

                        <div className="px-4 pb-4">
                          <div className="flex flex-wrap gap-2 pt-2 border-t mt-4">
                            <Link href={`/seller/orders/${order.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full h-10 rounded-xl gap-2 text-primary border-primary/10 hover:bg-primary/5">
                                <Receipt className="h-4 w-4" />
                                Detail & Cetak
                              </Button>
                            </Link>

                            {order.status === 'pending' && (
                              <div className="flex gap-2 w-full sm:w-auto flex-1">
                                <Button
                                  size="sm"
                                  className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700"
                                  onClick={() => {
                                    setRejectingOrderId(order.id);
                                    setSelectedReason("");
                                  }}
                                >
                                  Tolak
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700"
                                  onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                >
                                  Terima
                                </Button>
                              </div>
                            )}

                            {order.status === 'accepted' && (
                              <Button
                                size="sm"
                                className="flex-1 h-10 rounded-xl bg-purple-600 hover:bg-purple-700"
                                onClick={() => handleUpdateStatus(order.id, 'in_delivery')}
                              >
                                Kirim Sekarang
                              </Button>
                            )}
                          </div>

                          {order.status === 'in_delivery' && (
                            <div className="space-y-2">
                              {order.payment_method === 'cod' && order.payment_status !== 'paid' ? (
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdatePaymentStatus(order.id, 'paid')}
                                  className="w-full bg-green-600 hover:bg-green-700 shadow-sm"
                                >
                                  Konfirmasi Pembayaran Lunas
                                </Button>
                              ) : (
                                <div className="text-xs text-muted-foreground text-center py-2.5 bg-gray-50 border rounded-xl flex items-center justify-center gap-2">
                                  <Clock className="h-3 w-3 animate-pulse text-purple-500" />
                                  Menunggu konfirmasi pembeli
                                </div>
                              )}
                            </div>
                          )}

                          {(order.status === 'rejected' || order.status === 'expired') && order.rejection_reason && (
                            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                              <XCircle className="h-3.5 w-3.5" />
                              <span><strong>Alasan:</strong> {order.rejection_reason}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Rejection Dialog */}
      <Dialog open={!!rejectingOrderId} onOpenChange={() => setRejectingOrderId(null)}>
        <DialogContent className="max-w-[90vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Tolak Pesanan</DialogTitle>
            <DialogDescription>
              Mohon pilih alasan penolakan pesanan ini untuk dikirimkan ke pembeli.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              {REJECTION_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${selectedReason === reason.value ? "border-primary bg-primary/5" : "border-gray-100 hover:bg-gray-50"
                    }`}
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedReason === reason.value ? "border-primary" : "border-gray-300"
                    }`}>
                    {selectedReason === reason.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="font-medium text-sm">{reason.label}</span>
                </div>
              ))}
            </div>

            {selectedReason === 'lainnya' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Ketik Alasan Sendiri</Label>
                <Textarea
                  placeholder="Contoh: Toko sedang ada perbaikan mendadak..."
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="rounded-xl resize-none h-24"
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setRejectingOrderId(null)}
              className="flex-1 rounded-xl"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isRejecting || (!selectedReason && !otherReason)}
              className="flex-1 rounded-xl"
            >
              {isRejecting ? "Memproses..." : "Tolak Pesanan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
