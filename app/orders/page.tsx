"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Clock, CheckCircle2, Package, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BuyerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

    // Fetch orders and their items, along with store name
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select(`
        id, 
        total_price, 
        status, 
        created_at,
        stores (name),
        order_items (
          id,
          quantity,
          price,
          products (name, unit)
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && ordersData) {
      setOrders(ordersData);
    }
    
    setIsLoading(false);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Memuat riwayat pesanan...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pesanan Saya</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-dashed border-gray-200">
            <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-bold text-gray-900">Belum Ada Pesanan</h2>
            <p className="text-gray-500 mb-6">Mulai belanja kebutuhanmu dari toko terdekat.</p>
            <Link href="/">
              <Button size="lg" className="rounded-xl">Cari Toko</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl">
                <CardHeader className="py-3 bg-white border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <StoreIcon className="h-4 w-4 text-primary" />
                      {order.stores?.name}
                    </CardTitle>
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-4 bg-white">
                  
                  {/* Status Indicator */}
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="flex items-center gap-3">
                      {order.status === 'pending' && <Clock className="h-5 w-5 text-amber-500" />}
                      {order.status === 'accepted' && <Package className="h-5 w-5 text-blue-500" />}
                      {order.status === 'in_delivery' && <MapPin className="h-5 w-5 text-indigo-500 animate-pulse" />}
                      {order.status === 'completed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                      {order.status === 'rejected' && <Clock className="h-5 w-5 text-red-500" />}
                      
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold ${
                          order.status === 'pending' ? 'text-amber-700' : 
                          order.status === 'accepted' ? 'text-blue-700' : 
                          order.status === 'in_delivery' ? 'text-indigo-700' :
                          order.status === 'completed' ? 'text-green-700' : 
                          'text-red-700'
                        }`}>
                          {order.status === 'pending' ? 'Menunggu Konfirmasi' : 
                           order.status === 'accepted' ? 'Sedang Disiapkan Seller' : 
                           order.status === 'in_delivery' ? 'Kurir Sedang Mengantar' :
                           order.status === 'completed' ? 'Pesanan Selesai' : 
                           'Pesanan Ditolak'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Summary */}
                  <div className="space-y-2">
                    {order.order_items.map((item: any, idx: number) => (
                      <div key={item.id} className="text-sm flex justify-between text-gray-600">
                        <span className="truncate pr-4">
                          <span className="font-semibold text-gray-900">{item.quantity}x</span> {item.products?.name}
                        </span>
                        <span className="shrink-0">
                          Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">Total Harga</span>
                    <span className="font-bold text-primary">Rp {order.total_price.toLocaleString('id-ID')}</span>
                  </div>

                  {order.status === 'in_delivery' && (
                    <Button className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white rounded-xl" onClick={async () => {
                        const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id);
                        if (!error) fetchOrders();
                    }}>
                      Konfirmasi Pesanan Diterima
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Simple internal icon to avoid extra import
function StoreIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z" />
      <path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9" />
      <path d="M12 3v6" />
    </svg>
  );
}
