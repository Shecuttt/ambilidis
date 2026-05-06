"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  Store,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useRouter } from "next/navigation";

const navItems = [
  { name: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { name: "Produk", href: "/seller/products", icon: Package },
  { name: "Pesanan", href: "/seller/orders", icon: ShoppingBag },
  { name: "Pengaturan", href: "/seller/settings", icon: Settings },
];

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface SellerSidebarProps {
  store?: {
    name: string;
    logo_url?: string | null;
    is_verified?: boolean;
  } | null;
}

const NavContent = ({ 
  isSetupPage, 
  pathname, 
  setIsOpen, 
  store, 
  setShowLogoutDialog 
}: { 
  isSetupPage: boolean; 
  pathname: string; 
  setIsOpen: (open: boolean) => void; 
  store?: any; 
  setShowLogoutDialog: (show: boolean) => void;
}) => (
  <div className="flex flex-col h-full bg-white border-r">
    <div className="p-6">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="p-1.5 bg-primary rounded-lg group-hover:rotate-6 transition-transform">
          <Store className="h-5 w-5 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-primary">
          ambilidis
        </span>
      </Link>
      <p className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-widest">
        {isSetupPage ? "Onboarding" : "Seller Center"}
      </p>
    </div>

    {isSetupPage ? (
      // Setup page - show onboarding message
      <div className="flex-1 px-6 flex items-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Store className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Setup Toko</h3>
            <p className="text-sm text-muted-foreground">
              Lengkapi informasi toko Anda untuk memulai berjualan
            </p>
          </div>
        </div>
      </div>
    ) : (
      // Normal navigation
      <>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href.includes('#') && pathname === item.href.split('#')[0]);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                  }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t mt-auto space-y-2">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
            {store?.logo_url ? (
              <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={store.logo_url} 
                  alt={store.name} 
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
                {store?.name?.charAt(0) || "S"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{store?.name || "Seller Account"}</p>
              <p className="text-[10px] text-muted-foreground truncate">
                {store?.is_verified ? "Verified Shop" : "Regular Shop"}
              </p>
            </div>
          </div>

          <Button
            onClick={() => setShowLogoutDialog(true)}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </>
    )}
  </div>
);

export function SellerSidebar({ store }: SellerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Check if user is on setup page
  const isSetupPage = pathname === "/seller/setup";

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to logout');
      }

      setShowLogoutDialog(false);
      toast.success("Anda telah berhasil keluar.");
      router.push('/');
      router.refresh();
    } catch (error: any) {
      setShowLogoutDialog(false);
      toast.error("Gagal keluar: " + (error.message || "Terjadi kesalahan"));
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 fixed inset-y-0 z-50">
        <NavContent 
          isSetupPage={isSetupPage}
          pathname={pathname}
          setIsOpen={setIsOpen}
          store={store}
          setShowLogoutDialog={setShowLogoutDialog}
        />
      </aside>

      {/* Mobile Trigger - positioned top right to avoid overlap with back/logo */}
      <div className="lg:hidden fixed top-3 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger render={
            <Button variant="outline" size="icon" className="bg-white/90 backdrop-blur-sm shadow-sm border-primary/20 h-10 w-10">
              <Menu className="h-5 w-5 text-primary" />
            </Button>
          } />
          <SheetContent side="left" className="p-0 w-64 border-none">
            <NavContent 
              isSetupPage={isSetupPage}
              pathname={pathname}
              setIsOpen={setIsOpen}
              store={store}
              setShowLogoutDialog={setShowLogoutDialog}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari dashboard seller? Pastikan semua perubahan telah disimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
