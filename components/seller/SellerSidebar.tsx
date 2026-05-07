"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Settings,
  Store,
  LogOut,
  ChevronUp,
  User2,
  Check,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const navItems = [
  { name: "Dashboard", href: "/seller/dashboard", icon: LayoutDashboard },
  { name: "Produk", href: "/seller/products", icon: Package },
  { name: "Pesanan", href: "/seller/orders", icon: ShoppingBag },
  { name: "Pengaturan", href: "/seller/settings", icon: Settings },
];

interface SellerSidebarProps {
  store?: {
    name: string;
    logo_url?: string | null;
    is_verified?: boolean;
  } | null;
}

export function SellerSidebar({ store }: SellerSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const isSetupPage = pathname === "/seller/setup";

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to logout");
      }

      setShowLogoutDialog(false);
      toast.success("Anda telah berhasil keluar.");
      router.push("/");
      router.refresh();
    } catch (error: any) {
      setShowLogoutDialog(false);
      toast.error("Gagal keluar: " + (error.message || "Terjadi kesalahan"));
    }
  };

  const handleNavClick = () => {
    setOpenMobile(false);
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4 border-b group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:h-16 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center transition-all">
          <Link
            href="/"
            className="flex items-center gap-2 group px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center"
          >
            <div className="p-1.5 bg-primary rounded-lg group-hover:rotate-6 transition-transform flex items-center justify-center shrink-0">
              <Store className="h-4 w-4 text-white" />
            </div>
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
              <Image
                src="/logo.png"
                alt="Ambilidis Logo"
                width={120}
                height={40}
                className="h-6 w-auto object-contain"
              />
              <span className="text-[10px] text-muted-foreground mt-1 font-medium uppercase tracking-widest">
                {isSetupPage ? "Onboarding" : "Seller Center"}
              </span>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2 group-data-[collapsible=icon]:p-3">
          {isSetupPage ? (
            <SidebarGroup>
              <SidebarGroupContent className="p-2">
                <div className="flex flex-col items-center justify-center text-center space-y-4 py-8 group-data-[collapsible=icon]:hidden">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">Setup Toko</h3>
                    <p className="text-xs text-muted-foreground">
                      Lengkapi informasi toko Anda untuk memulai berjualan
                    </p>
                  </div>
                </div>
                {/* Fallback for collapsed icon mode */}
                <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-4">
                  <Store className="h-5 w-5 text-primary" />
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href.includes("#") && pathname === item.href.split("#")[0]);
                    return (
                      <SidebarMenuItem key={item.name}>
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={item.name}
                          onClick={handleNavClick}
                          className="group-data-[collapsible=icon]:justify-center hover:bg-gray-100 hover:text-foreground transition-colors group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:mx-auto"
                          render={
                            <Link href={item.href}>
                              <item.icon className={isActive ? "text-primary" : "text-muted-foreground"} />
                              <span>{item.name}</span>
                            </Link>
                          }
                        />
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 border-t group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:h-16 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center transition-all">
          <SidebarMenu className="group-data-[collapsible=icon]:w-full">
            <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-gray-100 data-[state=open]:text-foreground hover:bg-gray-100 hover:text-foreground group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 transition-colors"
                    >
                      {store?.logo_url ? (
                        <div className="h-8 w-8 rounded-lg overflow-hidden border border-gray-100 shrink-0 relative">
                          <Image
                            src={store.logo_url}
                            alt={store.name}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {store?.name?.charAt(0) || "S"}
                        </div>
                      )}
                      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                        <span className="truncate font-semibold">{store?.name || "Seller Account"}</span>
                        <span className="truncate text-xs flex items-center gap-1">
                          {store?.is_verified && <Check className="h-2 w-2 text-primary" />}
                          {store?.is_verified ? "Verified Shop" : "Regular Shop"}
                        </span>
                      </div>
                      <ChevronUp className="ml-auto h-4 w-4 group-data-[collapsible=icon]:hidden" />
                    </SidebarMenuButton>
                  }
                />
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width] min-w-56 rounded-lg"
                  align="start"
                >
                  <DropdownMenuItem
                    onClick={() => setShowLogoutDialog(true)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer transition-colors"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Keluar dari Akun</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

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
