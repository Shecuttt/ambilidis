"use client";

import { Navigation } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { distanceLabel } from "@/lib/utils";
import Link from "next/link";

interface StoreCardProps {
  id: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  is_open: boolean;
  tagline_today: string | null;
  distance_km: number | null;
}

// Placeholder images untuk toko tanpa foto
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400&h=300",
  "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=400&h=300",
];

function getPlaceholder(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return PLACEHOLDER_IMAGES[sum % PLACEHOLDER_IMAGES.length];
}

export function StoreCard({
  id, name, description, photo_url,
  is_open, tagline_today, distance_km,
}: StoreCardProps) {
  return (
    <Link href={`/store/${id}`}>
      <Card className={`overflow-hidden border-0 shadow-sm hover:shadow-md transition-all cursor-pointer rounded-2xl group h-full ${!is_open ? "grayscale-30" : ""}`}>
        <div className="flex flex-col h-full">
          {/* ── Foto Toko ── */}
          <div className="w-full h-36 relative bg-gray-200 shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo_url || getPlaceholder(id)}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {/* Overlay tutup */}
            {!is_open && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                <span className="text-white text-xs font-bold px-3 py-1 border border-white/50 rounded-md tracking-wider">
                  TUTUP
                </span>
              </div>
            )}
            {/* Badge jarak — pakai shadcn Badge */}
            {distance_km != null && (
              <Badge
                className="absolute top-2 left-2 bg-black/60 text-white border-transparent text-[10px] gap-1 backdrop-blur-sm hover:bg-black/60"
              >
                <Navigation className="h-2.5 w-2.5" />
                {distanceLabel(distance_km)}
              </Badge>
            )}
          </div>

          {/* ── Info Toko ── */}
          <CardContent className="p-4 flex flex-col justify-between flex-1 bg-white">
            <div className="space-y-1.5">
              <h3 className="font-bold text-gray-900 leading-tight line-clamp-1">{name}</h3>
              {tagline_today ? (
                <p className="text-xs text-primary/80 italic line-clamp-1">
                  💬 {tagline_today}
                </p>
              ) : (
                <p className="text-xs text-gray-400 line-clamp-1">
                  {description || "Toko Sembako"}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between mt-3">
              {/* Rating (statis untuk MVP) */}
              <span className="flex items-center text-amber-500 text-xs font-medium">
                ⭐ 4.8
              </span>
              {/* Status buka/tutup — pakai Badge shadcn */}
              {is_open ? (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Buka
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-400 border-gray-200 text-xs">
                  Tutup
                </Badge>
              )}
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}
