"use client";

import { ArrowLeft, Clock, CheckCircle2, Package, Store, Receipt, AlertCircle, XCircle, Star, ShoppingBag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatRp } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface OrderDetailProps {
  order: any;
  currentUser: any;
}

export function OrderDetailPageClient({ order, currentUser }: OrderDetailProps) {
  const router = useRouter();

  const getStatusInfo = (status: string) => {
    const variants: Record<string, { color: string; icon: any; label: string; desc: string }> = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "Menunggu Konfirmasi",
        desc: "Toko sedang mengecek pesananmu. Harap tunggu sebentar."
      },
      accepted: {
        color: "bg-blue-100 text-blue-800",
        icon: CheckCircle2,
        label: "Diproses",
        desc: "Pesananmu telah diterima dan sedang disiapkan oleh toko."
      },
      in_delivery: {
        color: "bg-purple-100 text-purple-800",
        icon: Package,
        label: "Dalam Pengiriman",
        desc: "Kurir sedang dalam perjalanan menuju lokasimu."
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
        desc: order.rejection_reason || "Mohon maaf, pesanan tidak dapat diproses saat ini."
      },
      canceled: {
        color: "bg-gray-100 text-gray-800",
        icon: XCircle,
        label: "Dibatalkan",
        desc: "Pesanan ini telah dibatalkan."
      },
      expired: {
        color: "bg-gray-100 text-gray-800",
        icon: Clock,
        label: "Kadaluarsa",
        desc: "Batas waktu respon toko telah habis."
      },
    };

    return variants[status] || variants.pending;
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  const sortedLogs = [...(order.order_status_logs || [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-32 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 shrink-0 bg-muted/20 sm:bg-transparent">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="overflow-hidden">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">Detail Pesanan</h1>
            <p className="text-muted-foreground text-[10px] sm:text-xs font-mono uppercase tracking-tighter truncate">
              ID: {order.id}
            </p>
          </div>
        </div>
        {!order.ratings?.rating && order.status === 'completed' && (
          <Button size="sm" className="rounded-xl h-10 gap-2 bg-yellow-500 hover:bg-yellow-600">
            <Star className="h-4 w-4 fill-white" />
            Beri Rating
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        {/* Left Column */}
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

          {/* Store Info Section */}
          <Card className="border-muted-foreground/10 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Toko</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-black text-base">{order.stores?.name}</h4>
                    <p className="text-xs text-muted-foreground leading-snug max-w-xs truncate">
                      {order.stores?.address}
                    </p>
                  </div>
                </div>
                <Link href={`/store/${order.stores?.slug}`}>
                  <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5">
                    Kunjungi Toko
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card className="border-muted-foreground/10 shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="pb-3 border-b bg-muted/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Daftar Belanja</CardTitle>
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
                <span className="text-muted-foreground font-bold uppercase tracking-wider">Biaya Pengiriman</span>
                <span className="font-bold text-foreground">{formatRp(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between w-full pt-4 border-t border-primary/20">
                <span className="text-base sm:text-lg font-black text-primary uppercase">Total Pembayaran</span>
                <span className="text-base sm:text-lg font-black text-primary tabular-nums">{formatRp(order.total_price)}</span>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Timeline */}
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

          {/* Payment Summary Simple */}
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
