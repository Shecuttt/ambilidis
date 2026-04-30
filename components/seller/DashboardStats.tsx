"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRp } from "@/lib/utils";

interface DashboardStatsProps {
  activeOrdersCount: number;
  productsCount: number;
  grossRevenue: number;
}

export function DashboardStats({ activeOrdersCount, productsCount, grossRevenue }: DashboardStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan Hari Ini</CardTitle>
        <CardDescription>Statistik singkat penjualan.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1 p-4 bg-muted rounded-xl">
          <span className="text-muted-foreground text-sm font-medium">Order Aktif</span>
          <span className="text-3xl font-bold">{activeOrdersCount}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 bg-muted rounded-xl">
          <span className="text-muted-foreground text-sm font-medium">Total Produk</span>
          <span className="text-3xl font-bold">{productsCount}</span>
        </div>
        <div className="flex flex-col gap-1 p-4 bg-muted rounded-xl col-span-2">
          <span className="text-muted-foreground text-sm font-medium">Pendapatan Kotor Hari Ini</span>
          <span className="text-2xl font-bold text-green-600">{formatRp(grossRevenue)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
