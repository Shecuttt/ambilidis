"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { haversineKm, formatRp } from "@/lib/utils";
import {
  ArrowLeft, MapPin, CheckCircle2, Wallet, Receipt,
  Loader2, MessageSquare, AlertTriangle, ShoppingBag
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
import { LocationSearch } from "@/components/ui/location-search";

// ── Delivery fee constants ────────────────────────────────────
const DELIVERY_RATE_PER_KM = 2000; // Rp per km
const MIN_DELIVERY_FEE = 3000;     // minimum flat
const MAX_DELIVERY_FEE = 20000;    // cap

function calcDeliveryFee(distKm: number): number {
  const raw = Math.round(distKm * DELIVERY_RATE_PER_KM);
  return Math.max(MIN_DELIVERY_FEE, Math.min(MAX_DELIVERY_FEE, raw));
}

interface CheckoutPageClientProps {
  initialUser: any;
}

export function CheckoutPageClient({ initialUser }: CheckoutPageClientProps) {
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
  const [storeInfo, setStoreInfo] = useState<any>(null);

  const total = getTotal();
  const grandTotal = total + deliveryFee;

  // Reusable distance calculation logic
  const calculateAndSetDistance = async (lat: number, lng: number) => {
    if (!storeId) return;
    setIsCalcingDist(true);
    try {
      const { data } = await supabase
        .from("stores")
        .select("latitude, longitude")
        .eq("id", storeId)
        .single();

      if (data?.latitude && data?.longitude) {
        const dist = haversineKm(lat, lng, data.latitude, data.longitude);
        const fee = calcDeliveryFee(dist);
        setDistanceKm(dist);
        setDeliveryFee(fee);
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
      setDeliveryFee(MIN_DELIVERY_FEE);
      setDistanceKm(null);
    } finally {
      setIsCalcingDist(false);
    }
  };

  useEffect(() => {
    if (!storeId || items.length === 0) return;

    // Load user profile address
    const loadProfileAddress = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('address')
          .eq('id', initialUser.id)
          .single();

        if (!error && data?.address && data.address !== 'Alamat belum diatur') {
          setAddress(data.address);
        }
      } catch (error) {
        console.error('Error loading profile address:', error);
      }
    };

    loadProfileAddress();

    // Load store information
    const loadStoreInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name, slug')
          .eq('id', storeId)
          .single();

        if (!error && data) {
          setStoreInfo(data);
        }
      } catch (error) {
        console.error('Error loading store info:', error);
      }
    };

    loadStoreInfo();

    // Initial distance calculation from session
    const initDistance = () => {
      const raw = sessionStorage.getItem("ambilidis_buyer_location");
      if (raw) {
        const buyerLoc = JSON.parse(raw);
        calculateAndSetDistance(buyerLoc.lat, buyerLoc.lng);
      }
    };

    initDistance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, items.length]);

  // Success state check (MUST be before items.length check)
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card border-border">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Pesanan Berhasil!</h2>
              <p className="text-muted-foreground">
                Pesanan Anda telah diterima. Silakan tunggu konfirmasi dari penjual.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/orders">
                <Button className="w-full">Lihat Pesanan Saya</Button>
              </Link>
              <Link href="/discovery">
                <Button variant="outline" className="w-full">
                  Kembali Belanja
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state check
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-card border-border">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Keranjang Kosong</h2>
              <p className="text-muted-foreground">
                Keranjang belanja Anda masih kosong. Mulai belanja untuk mengisi keranjang.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link href="/discovery" className="w-full">
                <Button className="w-full">Cari Toko</Button>
              </Link>
              <Link href="/" className="w-full">
                <Button variant="outline" className="w-full">
                  Kembali ke Beranda
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      toast.error("Alamat pengiriman harus diisi.");
      return;
    }

    if (items.length === 0) {
      toast.error("Keranjang belanja kosong.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Create order via API (Secure server-side creation)
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          items,
          totalPrice: grandTotal,
          deliveryFee,
          paymentMethod,
          buyerNote: buyerNote.trim() || null,
          address: address.trim(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Gagal membuat pesanan");
      }

      const { order } = await response.json();

      // 2. Handle Midtrans payment if transfer
      if (paymentMethod === "transfer") {
        const response = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            grossAmount: grandTotal,
          }),
        });

        if (!response.ok) throw new Error("Gagal membuat pembayaran");

        const { token } = await response.json();

        // Redirect to Midtrans payment page
        (window as any).snap.pay(token, {
          onSuccess: (result: any) => {
            toast.success("Pembayaran berhasil!");
            clearCart();
            setIsSuccess(true);
          },
          onPending: (result: any) => {
            toast.success("Pesanan dibuat, menunggu pembayaran.");
            clearCart();
            setIsSuccess(true);
          },
          onError: (result: any) => {
            toast.error("Pembayaran gagal. Silakan coba lagi.");
          },
          onClose: () => {
            toast.info("Pembayaran dibatalkan.");
          },
        });
      } else {
        // COD - success immediately
        toast.success("Pesanan berhasil dibuat!");
        clearCart();
        setIsSuccess(true);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Gagal membuat pesanan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
      />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Checkout</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg">Alamat Pengiriman</h3>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="address" className="text-base">Alamat Lengkap</Label>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Sertakan detail seperti nomor rumah, blok, patokan, atau warna pagar agar kurir lebih mudah menemukan lokasi Anda.
                      </p>
                    </div>
                    <Textarea
                      id="address"
                      placeholder="Contoh: Jl. Mawar No. 123, Blok C, samping Masjid Al-Ikhlas (Pagar Hitam)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="resize-none rounded-xl border-muted-foreground/20 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-sm font-medium">Titik Lokasi (Map)</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Tentukan titik di peta untuk menghitung biaya pengiriman otomatis.
                      </p>
                    </div>
                    <LocationSearch
                      onLocationSelect={async (location) => {
                        // Update address dengan lokasi yang dipilih
                        setAddress(location.label);

                        // Save to profile database
                        try {
                          const { error } = await supabase
                            .from('profiles')
                            .upsert({
                              id: initialUser.id,
                              address: location.label,
                              location: `POINT(${location.lng} ${location.lat})`,
                            });

                          if (!error) {
                            toast.success('Lokasi berhasil disimpan ke profil');
                          }
                        } catch (error) {
                          console.error('Error saving location to profile:', error);
                        }

                        // Update sessionStorage untuk distance calculation
                        const buyerLoc = { lat: location.lat, lng: location.lng };
                        sessionStorage.setItem("ambilidis_buyer_location", JSON.stringify(buyerLoc));

                        // Recalculate distance
                        calculateAndSetDistance(location.lat, location.lng);
                      }}
                      placeholder="Cari lokasi di peta..."
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-muted-foreground mb-3 italic">
                    *Biaya pengiriman ditentukan berdasarkan titik lokasi di peta, mohon pastikan titik sudah tepat.
                  </p>
                  {distanceKm !== null ? (
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <div className="bg-primary/20 p-1.5 rounded-full">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-primary/70 tracking-wider">Estimasi Jarak</span>
                        <span className="text-sm font-bold text-foreground">{distanceKm.toFixed(1)} km dari toko</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="bg-amber-100 p-1.5 rounded-full">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="text-xs text-amber-800 font-medium">
                        Cari lokasi di peta untuk menghitung biaya pengiriman.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Detail Pesanan</h3>
                <CheckoutSummary
                  items={items}
                  total={total}
                  deliveryFee={deliveryFee}
                  distanceKm={distanceKm}
                  isCalcingDist={isCalcingDist}
                  deliveryRatePerKm={DELIVERY_RATE_PER_KM}
                />
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Metode Pembayaran</h3>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-4 w-4" />
                      <span>Bayar di Tempat (COD)</span>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer">
                      <Receipt className="h-4 w-4" />
                      <span>Transfer Bank</span>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === "transfer" && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Anda akan diarahkan ke halaman pembayaran setelah menekan tombol &quot;Buat Pesanan&quot;.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Catatan (Opsional)</h3>
                </div>
                <Textarea
                  placeholder="Tambahkan catatan untuk penjual..."
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <Card className="sticky top-4">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Ringkasan Pembayaran</h3>
                  {storeInfo && (
                    <Link
                      href={`/store/${storeInfo.slug || storeInfo.id}`}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Kembali ke {storeInfo.name}
                    </Link>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({items.length} item)</span>
                    <span>{formatRp(total)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span>Biaya pengiriman</span>
                    {isCalcingDist ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>{formatRp(deliveryFee)}</span>
                    )}
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span className="text-lg">{formatRp(grandTotal)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isLoading || items.length === 0 || !address.trim()}
                  className="w-full mt-6"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Membuat Pesanan...
                    </>
                  ) : (
                    "Buat Pesanan"
                  )}
                </Button>

                <div className="text-xs text-muted-foreground text-center mt-4">
                  Dengan membuat pesanan, Anda setuju dengan syarat dan ketentuan yang berlaku.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
