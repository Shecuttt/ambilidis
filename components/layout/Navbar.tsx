"use client";

import { ShoppingBag, Store, Menu, LogOut, Home, Search, History, Compass, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
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
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useAuth } from "@/components/providers/AuthProvider";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const cartTotalItems = useCartStore(s => s.items.reduce((acc, item) => acc + item.quantity, 0));
  const clearCart = useCartStore(s => s.clearCart);

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

      // Clear cart from localStorage when logout
      clearCart();

      setShowLogoutDialog(false);
      toast.success("Anda telah berhasil keluar.");
      router.push('/');
      router.refresh();
    } catch (error: any) {
      setShowLogoutDialog(false);
      toast.error("Gagal keluar: " + (error.message || "Terjadi kesalahan"));
    }
  };

  const getUserInitial = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">A</span>
          </div>
          Ambilidis
        </Link>


        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 mr-2">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/') ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              Beranda
            </Link>
            <Link
              href="/discovery"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/discovery') ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              Jelajahi
            </Link>
          </nav>

          {/* Cart - Only if logged in */}
          {user && (
            <Link href="/checkout" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingBag className="h-5 w-5" />
                {cartTotalItems > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                    {cartTotalItems}
                  </span>
                )}
              </Button>
            </Link>
          )}

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="relative h-8 w-8 rounded-full hidden md:block">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              } />
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{user.email?.split('@')[0]}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/orders')} className="cursor-pointer">
                  <History className="mr-2 h-4 w-4" />
                  <span>Riwayat Pesanan</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/checkout')} className="cursor-pointer">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>Keranjang Saya</span>
                  {cartTotalItems > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                      {cartTotalItems}
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/seller/dashboard')} className="cursor-pointer">
                  <Store className="mr-2 h-4 w-4" />
                  <span>Dashboard Seller</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/seller/login" className="hidden sm:block">
              <Button variant="outline">
                Jadi Seller
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button using Sheet */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
            } />
            <SheetContent side="right" className="w-[300px] sm:w-[350px] p-0 flex flex-col">
              <div className="p-6 border-b">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2 font-bold text-xl">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">A</span>
                  </div>
                  Ambilidis
                </Link>
              </div>

              <div className="flex-1 overflow-y-auto py-4">
                {/* User Profile Section if Logged In */}
                {user && (
                  <div className="px-6 py-4 mb-2">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/50 border">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {getUserInitial()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-semibold truncate">{user.email?.split('@')[0]}</span>
                        <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                      </div>
                    </div>
                  </div>
                )}

                <nav className="flex flex-col px-2 gap-1">
                  <div className="px-4 py-2 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    Menu Utama
                  </div>
                  <Link
                    href="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Home className="h-4 w-4" />
                      <span>Beranda</span>
                    </div>
                    {isActive('/') && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </Link>
                  <Link
                    href="/discovery"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/discovery') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Compass className="h-4 w-4" />
                      <span>Jelajahi</span>
                    </div>
                    {isActive('/discovery') && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </Link>

                  {user && (
                    <>
                      <div className="px-4 py-2 mt-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Aktivitas Saya
                      </div>
                      <Link
                        href="/orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/orders') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <History className="h-4 w-4" />
                          <span>Riwayat Pesanan</span>
                        </div>
                        {isActive('/orders') && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </Link>
                      <Link
                        href="/checkout"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/checkout') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <ShoppingBag className="h-4 w-4" />
                          <span>Keranjang Saya</span>
                        </div>
                        {cartTotalItems > 0 && (
                          <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {cartTotalItems}
                          </span>
                        )}
                      </Link>

                      <div className="px-4 py-2 mt-4 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Bisnis
                      </div>
                      <Link
                        href="/seller/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive('/seller/dashboard') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                          }`}
                      >
                        <Store className="h-4 w-4" />
                        <span>Dashboard Seller</span>
                      </Link>
                    </>
                  )}
                </nav>
              </div>

              <div className="p-4 border-t mt-auto">
                {user ? (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setShowLogoutDialog(true);
                    }}
                    className="w-full justify-start gap-3 text-red-600 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Keluar dari Akun</span>
                  </Button>
                ) : (
                  <Link href="/seller/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full gap-2">
                      <Store className="h-4 w-4" />
                      Jadi Seller Sekarang
                    </Button>
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>


      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Keluar</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun Anda? Anda harus masuk kembali untuk mengakses dashboard seller atau riwayat pesanan.
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
    </header>
  );
}
