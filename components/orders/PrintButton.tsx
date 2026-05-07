"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all flex items-center gap-2 mx-auto"
    >
      <Printer className="h-5 w-5" />
      Cetak Sekarang
    </button>
  );
}
