"use client";

import { ArrowLeft, Clock, CheckCircle2, Package, MapPin, Phone, User, Printer, ShoppingBag, Receipt, AlertCircle, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatRp } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface SellerOrderDetailProps {
  order: any;
  currentUser: any;
}

export function SellerOrderDetailPageClient({ order, currentUser }: SellerOrderDetailProps) {
  const router = useRouter();

  const getStatusInfo = (status: string) => {
    const variants: Record<string, { color: string; icon: any; label: string; desc: string }> = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "Menunggu Konfirmasi",
        desc: "Pesanan baru masuk. Segera konfirmasi untuk memproses."
      },
      accepted: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle2,
        label: "Diproses",
        desc: "Pesanan telah diterima. Siapkan produk untuk dikirim."
      },
      in_delivery: {
        color: "bg-purple-100 text-purple-800",
        icon: Package,
        label: "Dalam Pengiriman",
        desc: "Pesanan sedang diantar kurir. Pantau hingga sampai ke pembeli."
      },
      completed: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle2,
        label: "Selesai",
        desc: "Pesanan telah sampai dan diterima dengan baik."
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Ditolak",
        desc: order.rejection_reason || "Pesanan telah ditolak."
      },
      canceled: {
        color: "bg-gray-100 text-gray-800",
        icon: XCircle,
        label: "Dibatalkan",
        desc: "Pesanan dibatalkan oleh pembeli."
      },
      expired: {
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
        label: "Kadaluarsa",
        desc: "Batas waktu respon telah habis."
      },
    };

    return variants[status] || variants.pending;
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  const sortedLogs = [...(order.order_status_logs || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status: newStatus }),
      });

      if (!response.ok) throw new Error('Gagal update status');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 bg-muted/20 sm:bg-transparent">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Kelola Pesanan</h1>
            <p className="text-muted-foreground text-[10px] sm:text-xs font-mono uppercase tracking-tighter">
              ID: {order.id.split('-')[0].toUpperCase()}
            </p>
          </div>
        </div>
        <Link href={`/seller/orders/${order.id}/print`}>
          <Button variant="outline" className="rounded-xl gap-2 h-10 border-primary text-primary hover:bg-primary/5">
            <Printer className="h-4 w-4" />
            Cetak Resi / Alamat
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Status Alert */}
          <div className={`p-4 sm:p-6 rounded-3xl border-none shadow-sm ${statusInfo.color.split(' ')[0]} bg-opacity-20 flex items-start gap-4`}>
            <div className={`p-2.5 rounded-2xl ${statusInfo.color.split(' ')[0]} bg-opacity-30 shrink-0`}>
              <StatusIcon className={`h-6 w-6 ${statusInfo.color.split(' ')[1]}`} />
            </div>
            <div className="space-y-1">
              <h3 className={`font-black text-sm sm:text-base ${statusInfo.color.split(' ')[1]}`}>{statusInfo.label}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-md">
                {statusInfo.desc}
              </p>
            </div>
          </div>

          {/* Action Controls */}
          {(order.status === 'pending' || order.status === 'accepted') && (
            <Card className="border-primary/20 bg-primary/5 rounded-3xl overflow-hidden border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Update Status Pesanan</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {order.status === 'pending' && (
                  <>
                    <Button onClick={() => handleUpdateStatus('accepted')} className="flex-1 h-11 rounded-xl bg-primary shadow-lg shadow-primary/20">
                      Terima Pesanan
                    </Button>
                    <Button variant="outline" className="flex-1 h-11 rounded-xl border-red-200 text-red-600 hover:bg-red-50">
                      Tolak
                    </Button>
                  </>
                )}
                {order.status === 'accepted' && (
                  <Button onClick={() => handleUpdateStatus('in_delivery')} className="w-full h-11 rounded-xl bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200">
                    Kirim Pesanan Sekarang
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Buyer Information - CRITICAL FOR SELLER */}
          <Card className="border-muted-foreground/10 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-black uppercase tracking-widest">Informasi Pembeli</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nama Lengkap</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{order.buyer_name || 'Pembeli'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nomor HP</span>
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span className="font-bold text-sm tabular-nums">{order.buyer_phone || '-'}</span>
                      {order.buyer_phone && (
                        <a href={`https://wa.me/${order.buyer_phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-green-600 hover:underline ml-2">
                          Hubungi WA
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Alamat Pengiriman</span>
                  <div className="flex gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-relaxed italic">
                      {order.shipping_address || 'Alamat tidak tersedia'}
                    </p>
                  </div>
                </div>
              </div>

              {order.buyer_note && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Catatan Pembeli:</p>
                    <p className="text-xs font-bold text-amber-900/80 italic">&quot;{order.buyer_note}&quot;</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="border-muted-foreground/10 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-black uppercase tracking-widest">Produk yang Dipesan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-muted">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="p-4 sm:p-6 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {item.products?.photo_url && (
                        <div className="h-14 w-14 rounded-2xl bg-muted overflow-hidden shrink-0 border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={item.products.photo_url} alt={item.products.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-sm sm:text-base line-clamp-1">{item.products?.name}</h4>
                        <p className="text-[11px] sm:text-xs text-muted-foreground font-medium">
                          {item.quantity} {item.products?.unit} x {formatRp(item.price)}
                        </p>
                      </div>
                    </div>
                    <div className="font-black text-sm sm:text-base text-right tabular-nums text-foreground/90">
                      {formatRp(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="bg-primary/5 p-6 sm:p-8 flex flex-col gap-4 border-t border-primary/10">
              <div className="flex justify-between w-full text-xs sm:text-sm">
                <span className="text-muted-foreground font-bold uppercase tracking-wider">Subtotal Produk</span>
                <span className="font-bold text-foreground">{formatRp(order.total_price - order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between w-full text-xs sm:text-sm">
                <span className="text-muted-foreground font-bold uppercase tracking-wider">Ongkir</span>
                <span className="font-bold text-foreground">{formatRp(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between w-full pt-4 border-t border-primary/20">
                <span className="text-base sm:text-lg font-black text-primary uppercase">Total Pembayaran</span>
                <span className="text-base sm:text-lg font-black text-primary tabular-nums">{formatRp(order.total_price)}</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-8">
          {/* Tracking Timeline */}
          <Card className="border-muted-foreground/10 shadow-sm rounded-3xl overflow-hidden bg-muted/5">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Lacak Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-6 pb-10">
              <div className="relative space-y-10 before:absolute before:inset-0 before:ml-[11px] before:-translate-x-1/2 before:h-full before:w-[2px] before:bg-linear-to-b before:from-primary/30 before:to-transparent">
                {sortedLogs.length > 0 ? sortedLogs.map((log: any, index: number) => {
                  const logInfo = getStatusInfo(log.status);
                  const isLatest = index === 0;

                  return (
                    <div key={log.id} className="relative flex items-start gap-5 pl-1">
                      <div className={`mt-1 relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${isLatest ? 'bg-primary border-primary shadow-lg shadow-primary/30' : 'bg-background border-muted'}`}>
                        {isLatest ? (
                          <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={`text-xs font-black uppercase tracking-tight ${isLatest ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {logInfo.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold tabular-nums tracking-tighter">
                          {new Date(log.created_at).toLocaleString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center py-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Belum ada riwayat status.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card className="border-muted-foreground/10 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground uppercase tracking-tight">Metode</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary font-black text-[10px] px-2.5 py-1 uppercase">
                  {order.payment_method === 'cod' ? 'COD' : 'Transfer'}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-muted-foreground uppercase tracking-tight">Status</span>
                <Badge className={`${order.payment_status === 'paid' ? 'bg-green-500' : 'bg-muted text-muted-foreground'} text-white font-black text-[10px] px-2.5 py-1 uppercase`}>
                  {order.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
