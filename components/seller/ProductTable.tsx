"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Loader2, Package } from "lucide-react";
import { formatRp } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  is_available: boolean;
  photo_url: string | null;
}

interface ProductTableProps {
  products: Product[];
  isLoading: boolean;
  togglingProductId: string | null;
  onToggleAvailability: (id: string, current: boolean) => void;
}

export function ProductTable({ products, isLoading, togglingProductId, onToggleAvailability }: ProductTableProps) {
  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Nama Produk</TableHead>
            <TableHead>Harga</TableHead>
            <TableHead>Satuan</TableHead>
            <TableHead className="text-center">Stok</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                Belum ada produk. Silakan tambah produk pertama Anda.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow key={product.id} className={!product.is_available ? "opacity-60" : ""}>
                <TableCell className="pr-0">
                  {product.photo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.photo_url}
                      alt={product.name}
                      className="h-10 w-10 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{formatRp(product.price)}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    {togglingProductId === product.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <Switch
                        checked={product.is_available}
                        onCheckedChange={() => onToggleAvailability(product.id, product.is_available)}
                        className="data-[state=checked]:bg-green-500"
                      />
                    )}
                    <span className={`text-[10px] font-semibold ${
                      product.is_available ? "text-green-600" : "text-gray-400"
                    }`}>
                      {product.is_available ? "Tersedia" : "Habis"}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
