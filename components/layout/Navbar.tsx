"use client";

import { ShoppingBag, Store, Menu, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

import { useAuth } from "@/components/providers/AuthProvider";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const cartTotalItems = useCartStore(s => s.items.reduce((acc, item) => acc + item.quantity, 0));

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setShowLogoutDialog(false);
      toast.success("Anda telah berhasil keluar.");
      router.push('/');
      router.refresh();
    } catch (error: any) {
      setShowLogoutDialog(false);
      toast.error("Gagal keluar: " + error.message);
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

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
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
          <Link
            href="/orders"
            className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/orders') ? 'text-primary' : 'text-muted-foreground'
              }`}
          >
            Pesanan
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Cart */}
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

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                      {getUserInitial()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              } />
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuItem onClick={() => router.push('/seller/dashboard')}>
                  <Store className="h-4 w-4 mr-2" />
                  Dashboard Seller
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/seller/dashboard" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-primary">
                Jadi Seller
              </Button>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background p-4 space-y-4">
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm font-medium ${isActive('/') ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              Beranda
            </Link>
            <Link
              href="/discovery"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm font-medium ${isActive('/discovery') ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              Jelajahi
            </Link>
            <Link
              href="/orders"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`text-sm font-medium ${isActive('/orders') ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              Pesanan
            </Link>
            {user ? (
              <>
                <Link
                  href="/seller/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-sm font-medium text-muted-foreground"
                >
                  Dashboard Seller
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setShowLogoutDialog(true);
                  }}
                  className="text-left text-sm font-medium text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/seller/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-muted-foreground"
              >
                Jadi Seller
              </Link>
            )}
          </nav>
        </div>
      )}

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
