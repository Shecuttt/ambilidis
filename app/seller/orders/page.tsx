"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Utility for countdown
function getRemainingMinutes(createdAt: string) {
  const orderTime = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffMs = orderTime + 15 * 60 * 1000 - now; // 15 minutes
  return Math.max(0, Math.floor(diffMs / 1000 / 60));
}

export default function SellerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storeId, setStoreId] = useState<string | null>(null);

  // Auto update countdown every minute
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

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

      // Fetch orders and their items
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

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Gagal dari server');
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) {
      console.error(error);
      alert("Gagal mengupdate status pesanan.");
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentStatus }),
      });

      if (!response.ok) {
        throw new Error('Gagal dari server');
      }

      setOrders(orders.map(o => o.id === orderId ? { ...o, payment_status: paymentStatus } : o));
    } catch (error) {
      console.error(error);
      alert("Gagal mengupdate status pembayaran.");
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat pesanan...</div>;
  }

  return (
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
          orders.map((order) => {
            const isPending = order.status === 'pending';
            const remainingMins = getRemainingMinutes(order.created_at);
            const isExpired = isPending && remainingMins <= 0;
            const isTransfer = order.payment_method === 'transfer';
            const isPaid = order.payment_status === 'paid';

            // Auto-reject in UI if expired AND it's COD
            if (isExpired && isPending && !isTransfer) {
              handleUpdateStatus(order.id, 'rejected');
              order.status = 'rejected';
            }

            // Auto-complete if 24 hours passed since in_delivery
            if (order.status === 'in_delivery' && order.updated_at) {
               const deliveryHours = (new Date().getTime() - new Date(order.updated_at).getTime()) / 1000 / 60 / 60;
               if (deliveryHours >= 24) {
                 handleUpdateStatus(order.id, 'completed');
                 order.status = 'completed';
               }
            }

            return (
              <Card key={order.id} className="overflow-hidden border shadow-sm">
                <CardHeader className={`py-3 ${order.status === 'pending' ? 'bg-amber-50' :
                    order.status === 'accepted' ? 'bg-blue-50' :
                      order.status === 'in_delivery' ? 'bg-indigo-50' :
                        order.status === 'completed' ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      ID: {order.id.slice(0, 8).toUpperCase()}
                      <span className={`ml-2 px-2 py-0.5 text-[10px] uppercase font-bold rounded-sm border ${isTransfer ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-orange-100 text-orange-800 border-orange-200'}`}>
                        {isTransfer ? 'TRANSFER' : 'COD'}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 text-[10px] uppercase font-bold rounded-sm border ${isPaid ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                        {isPaid ? 'PAID' : 'UNPAID'}
                      </span>
                    </CardTitle>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'in_delivery' ? 'bg-indigo-100 text-indigo-700' :
                            order.status === 'completed' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'
                      }`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="divide-y text-sm">
                    {order.order_items.map((item: any) => (
                      <div key={item.id} className="py-2 flex justify-between">
                        <div>
                          <span className="font-semibold">{item.quantity}x</span> {item.products?.name}
                        </div>
                        <span className="text-gray-500">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-start pt-2 border-t font-bold">
                    <span>Total Pembayaran</span>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-primary text-lg">Rp {order.total_price.toLocaleString('id-ID')}</span>
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
                </CardContent>

                {order.status === 'pending' && (
                  <CardFooter className="bg-gray-50 p-4 flex flex-col gap-3">
                    {isTransfer ? (
                      <div className="w-full flex flex-col gap-2">
                        {isPaid ? (
                          <>
                            <div className="text-green-600 text-sm font-semibold flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4" /> Pembeli sudah membayar lunas. Segera proses pesanan!
                            </div>
                            <Button
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleUpdateStatus(order.id, 'accepted')}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" /> Terima Order
                            </Button>
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
                              onClick={() => handleUpdateStatus(order.id, 'rejected')}
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
                      Menunggu Buyer untuk mengkonfirmasi pesanan diterima.<br/>
                      (Akan otomatis selesai dalam 24 Jam)
                    </p>
                  </CardFooter>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
