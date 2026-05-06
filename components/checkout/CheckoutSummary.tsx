"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Receipt, Navigation, Loader2 } from "lucide-react";
import { formatRp, distanceLabel } from "@/lib/utils";

interface CheckoutSummaryProps {
  items: any[];
  total: number;
  deliveryFee: number;
  distanceKm: number | null;
  isCalcingDist: boolean;
  deliveryRatePerKm: number;
}

export function CheckoutSummary({
  items,
  total,
  deliveryFee,
  distanceKm,
  isCalcingDist,
  deliveryRatePerKm
}: CheckoutSummaryProps) {
  const grandTotal = total + deliveryFee;

  return (
    <section className="space-y-3">
      <h2 className="font-bold text-foreground flex items-center gap-2">
        <Receipt className="h-5 w-5 text-primary" />
        Ringkasan Pesanan
      </h2>
      <Card className="border border-border shadow-sm bg-card">
        <CardContent className="p-0">
          <div className="divide-y">
            {items.map(item => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.quantity} × {formatRp(item.price)}</p>
                </div>
                <p className="font-bold text-sm text-foreground">
                  {formatRp(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 bg-muted/30 rounded-b-xl border-t border-border space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatRp(total)}</span>
            </div>

            <div className="flex items-start justify-between text-sm gap-3">
              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                <Navigation className="h-3.5 w-3.5" />
                <span>Ongkos Kirim</span>
              </div>
              {isCalcingDist ? (
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> Menghitung...
                </span>
              ) : (
                <div className="text-right">
                  <span className="font-medium">{formatRp(deliveryFee)}</span>
                  {distanceKm != null && (
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {distanceLabel(distanceKm)}
                      {" × "}{formatRp(deliveryRatePerKm)}/km
                    </p>
                  )}
                  {distanceKm == null && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">flat fee (lokasi tidak tersedia)</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2 border-t font-bold">
              <span>Total</span>
              <span className="text-accent">{formatRp(grandTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
