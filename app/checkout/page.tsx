"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { haversineKm, formatRp } from "@/lib/utils";
import {
  ArrowLeft, MapPin, CheckCircle2, Wallet, Receipt,
  Loader2, MessageSquare, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { toast } from "sonner";

// Sub-components
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";

// ── Delivery fee constants ────────────────────────────────────
const DELIVERY_RATE_PER_KM = 2000; // Rp per km
const MIN_DELIVERY_FEE = 3000;     // minimum flat
const MAX_DELIVERY_FEE = 20000;    // cap

function calcDeliveryFee(distKm: number): number {
  const raw = Math.round(distKm * DELIVERY_RATE_PER_KM);
  return Math.max(MIN_DELIVERY_FEE, Math.min(MAX_DELIVERY_FEE, raw));
}


// ── Main Component ───────────────────────────────────────────
export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, storeId, clearCart } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form fields
  const [address, setAddress] = useState("");
  const [buyerNote, setBuyerNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  // Delivery fee calculation
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [deliveryFee, setDeliveryFee] = useState(MIN_DELIVERY_FEE);
  const [isCalcingDist, setIsCalcingDist] = useState(false);

  const total = getTotal();
  const grandTotal = total + deliveryFee;

  // ── Load buyer location from sessionStorage & fetch store coords ──
  useEffect(() => {
    if (!storeId) return;
    calcDistance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const calcDistance = async () => {
    setIsCalcingDist(true);
    try {
      // 1. Buyer location from sessionStorage
      const raw = sessionStorage.getItem("ambilidis_buyer_location");
      if (!raw) {
        setDeliveryFee(MIN_DELIVERY_FEE);
        setDistanceKm(null);
        return;
      }
      const buyerLoc: { lat: number; lng: number } = JSON.parse(raw);

      // 2. Store coordinates from DB
      const { data } = await supabase
        .from("stores")
        .select("latitude, longitude")
        .eq("id", storeId)
        .single();

      if (!data?.latitude || !data?.longitude) {
        // Store belum mengisi koordinat → pakai flat fee
        setDeliveryFee(MIN_DELIVERY_FEE);
        setDistanceKm(null);
        return;
      }

      // 3. Hitung jarak & fee
      const km = haversineKm(buyerLoc.lat, buyerLoc.lng, data.latitude, data.longitude);
      setDistanceKm(km);
      setDeliveryFee(calcDeliveryFee(km));
    } catch {
      setDeliveryFee(MIN_DELIVERY_FEE);
    } finally {
      setIsCalcingDist(false);
    }
  };

  // ── Checkout handler ─────────────────────────────────────────
  const handleCheckout = async () => {
    if (!storeId || items.length === 0) return;
    if (!address.trim()) {
      toast.warning("Mohon isi alamat pengiriman.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Kamu harus login sebagai Buyer untuk checkout.");
        router.push("/login");
        return;
      }

      // 2. Insert Order (sertakan buyer_note & delivery_fee)
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert([{
          buyer_id: user.id,
          store_id: storeId,
          total_price: grandTotal,
          status: "pending",
          payment_method: paymentMethod,
          delivery_fee: deliveryFee,
          buyer_note: buyerNote.trim() || null,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Insert Order Items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Midtrans if transfer
      if (paymentMethod === "transfer") {
        const response = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: orderData.id, grossAmount: grandTotal }),
        });

        const paymentData = await response.json();

        if (paymentData.token) {
          (window as any).snap.pay(paymentData.token, {
            onSuccess: () => { clearCart(); setIsSuccess(true); setIsLoading(false); },
            onPending: () => { clearCart(); setIsSuccess(true); setIsLoading(false); },
            onError: () => { toast.error("Pembayaran gagal!"); setIsLoading(false); },
            onClose: () => { setIsLoading(false); },
          });
          return;
        } else {
          throw new Error(paymentData.error || "Gagal mendapatkan token pembayaran");
        }
      }

      // 5. COD: notify seller via WA
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderData.id }),
      }).catch(err => console.error("Error notifying seller:", err));

      clearCart();
      setIsSuccess(true);
      toast.success("Pesanan berhasil dibuat!");

    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(`Gagal membuat pesanan: ${error.message}`);
    } finally {
      if (paymentMethod !== "transfer") setIsLoading(false);
    }
  };

  // ── Success State ────────────────────────────────────────────
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
          <Link href="/orders">
            <Button className="w-full mt-4" size="lg">Lihat Status Pesanan</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full">Kembali ke Beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty Cart ───────────────────────────────────────────────
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

  // ── Main Render ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 pb-28">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""}
        strategy="lazyOnload"
      />

      {/* ── Header ── */}
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Checkout</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Kolom Kiri ── */}
        <div className="space-y-6">

          {/* Alamat Pengiriman */}
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
                  placeholder="Contoh: Jl. Sudirman No. 12, RT 03/RW 05"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                />
              </CardContent>
            </Card>
          </section>

          {/* Catatan untuk Seller */}
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Catatan untuk Penjual
              <span className="text-xs text-gray-400 font-normal">(opsional)</span>
            </h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <Textarea
                  id="buyer-note"
                  placeholder='Contoh: "Tolong sertakan daun bawang extra" atau "Antar jam 07.00 ya pak"'
                  value={buyerNote}
                  onChange={e => setBuyerNote(e.target.value.slice(0, 200))}
                  rows={3}
                  className="resize-none text-sm"
                />
                <p className="text-xs text-gray-400 text-right">{buyerNote.length}/200</p>
              </CardContent>
            </Card>
          </section>

          {/* Metode Pembayaran */}
          <section className="space-y-3">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Metode Pembayaran
            </h2>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer font-medium">Bayar di Tempat (COD)</Label>
                  </div>
                  <div className="flex flex-col p-3 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="transfer" id="transfer" />
                      <Label htmlFor="transfer" className="flex-1 cursor-pointer font-medium">Transfer Bank</Label>
                    </div>
                    {paymentMethod === "transfer" && (
                      <p className="text-xs text-amber-700 mt-2 ml-7 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100">
                        Pesanan Transfer <b>tidak dapat dibatalkan</b> oleh pembeli setelah dibayar.
                      </p>
                    )}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* ── Kolom Kanan ── */}
        <div className="space-y-6">
          {/* Checkout Summary */}
          <CheckoutSummary
            items={items}
            total={total}
            deliveryFee={deliveryFee}
            distanceKm={distanceKm}
            isCalcingDist={isCalcingDist}
            deliveryRatePerKm={DELIVERY_RATE_PER_KM}
          />

          {/* Hint lokasi — shadcn Alert */}
          {distanceKm == null && !isCalcingDist && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-700">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-700 text-xs">
                Ongkir dihitung flat karena koordinat toko atau lokasi kamu belum tersedia.
                Isi lokasi di halaman utama untuk harga yang lebih akurat.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>

      {/* ── Bottom Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-gray-500">Total Pembayaran</span>
            <span className="text-lg font-bold text-primary">{formatRp(grandTotal)}</span>
          </div>
          <Button
            size="lg"
            className="rounded-xl px-8"
            onClick={handleCheckout}
            disabled={isLoading || isCalcingDist}
          >
            {isLoading
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : "Pesan Sekarang"
            }
          </Button>
        </div>
      </div>
    </div>
  );
}
