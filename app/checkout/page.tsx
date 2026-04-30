"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, MapPin, CheckCircle2, Wallet, Receipt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, storeId, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const total = getTotal();
  const deliveryFee = 5000; // Dummy flat fee for MVP
  const grandTotal = total + deliveryFee;

  const handleCheckout = async () => {
    if (!storeId || items.length === 0) return;
    if (!address.trim()) {
      alert("Mohon isi alamat pengiriman");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Get current buyer
      const { data: { user } } = await supabase.auth.getUser();
      let buyerId = user?.id;

      if (!user) {
        alert("Kamu harus login sebagai Buyer untuk melakukan checkout. Silakan login terlebih dahulu.");
        router.push("/login");
        return;
      }

      // 2. Insert Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          buyer_id: buyerId,
          store_id: storeId,
          total_price: grandTotal,
          status: 'pending',
          payment_method: paymentMethod
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Insert Order Items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Trigger Midtrans if payment method is transfer
      if (paymentMethod === 'transfer') {
        const response = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.id,
            grossAmount: grandTotal,
          })
        });
        
        const paymentData = await response.json();

        if (paymentData.token) {
          (window as any).snap.pay(paymentData.token, {
            onSuccess: function(result: any) {
              console.log("Payment success", result);
              clearCart();
              setIsSuccess(true);
              setIsLoading(false);
            },
            onPending: function(result: any) {
              console.log("Payment pending", result);
              clearCart();
              setIsSuccess(true);
              setIsLoading(false);
            },
            onError: function(result: any) {
              console.error("Payment error", result);
              alert("Pembayaran gagal!");
              setIsLoading(false);
            },
            onClose: function() {
              console.log("Payment popup closed");
              setIsLoading(false);
            }
          });
          return; // Stop execution here because Snap handles the success/fail states
        } else {
          throw new Error(paymentData.error || "Gagal mendapatkan token pembayaran");
        }
      }

      // Success for COD
      // Notify seller
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.id })
      }).catch(err => console.error("Error notifying seller:", err));

      clearCart();
      setIsSuccess(true);

    } catch (error: any) {
      console.error("Checkout error:", error);
      alert(`Gagal membuat pesanan: ${error.message}`);
    } finally {
      if (paymentMethod !== 'transfer') {
        setIsLoading(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="h-24 w-24 text-green-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Pesanan Berhasil!</h1>
            <p className="text-gray-500">Toko sedang menyiapkan pesananmu. Kurir akan segera mengambilnya.</p>
          </div>
          <Link href="/">
            <Button className="w-full mt-4" size="lg">Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center space-y-4">
        <Receipt className="h-16 w-16 text-gray-300" />
        <h2 className="text-lg font-bold">Keranjang Kosong</h2>
        <p className="text-sm text-gray-500">Yuk cari toko dan mulai belanja kebutuhanmu!</p>
        <Button onClick={() => router.push("/")}>Cari Toko</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""}
        strategy="lazyOnload"
      />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Delivery Address */}
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Alamat Pengiriman
            </h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Label htmlFor="address">Detail Alamat</Label>
                <Input
                  id="address"
                  placeholder="Contoh: Jl. Sudirman No. 12, Pagar Hitam"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </CardContent>
            </Card>
          </section>

          {/* Payment Method */}
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Metode Pembayaran
            </h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <div className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer font-medium">Bayar di Tempat (COD)</Label>
                  </div>
                  <div className="flex items-center space-x-3 space-y-0 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label htmlFor="transfer" className="flex-1 cursor-pointer font-medium">Transfer Bank</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="space-y-6">
          {/* Order Items */}
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Ringkasan Pesanan
            </h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-0">
                <div className="divide-y">
                  {items.map(item => (
                    <div key={item.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="font-bold text-sm text-gray-900">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-gray-50 rounded-b-xl border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium">Rp {total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ongkos Kirim (Dummy Kurir)</span>
                    <span className="font-medium">Rp {deliveryFee.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      {/* Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Total Pembayaran</span>
            <span className="text-lg font-bold text-primary">Rp {grandTotal.toLocaleString('id-ID')}</span>
          </div>
          <Button 
            size="lg" 
            className="w-1/2 rounded-xl"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Pesan Sekarang"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
