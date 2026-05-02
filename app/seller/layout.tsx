import { SellerSidebar } from "@/components/seller/SellerSidebar";
import { Store } from "lucide-react";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-white border-b sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-primary">ambilidis</span>
          </div>
          {/* Sidebar trigger is handled inside SellerSidebar, but we can also put it here if we want more control. 
              Currently SellerSidebar has a floating button. Let's move it into this header for a cleaner look. */}
        </header>

        <main className="flex-1 lg:pl-64">
          <div className="p-4 lg:p-8 max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
