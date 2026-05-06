# DRAFT 5: Dashboard UX & Authentication Refinement

Tahap ini fokus pada peningkatan UX sisi seller serta perbaikan sistem autentikasi dan manajemen sesi.

---

## Konteks Struktur Saat Ini

```
app/seller/
├── layout.tsx              ← wrapper layout seller (sudah ada)
├── dashboard/
│   └── page.tsx            ← monolitik: stats + produk + settings
└── orders/
    └── page.tsx

components/seller/
├── SellerSidebar.tsx       ← komponen sidebar (sudah ada)
├── DashboardStats.tsx
├── ProductTable.tsx
├── AddProductDialog.tsx
└── StoreSettings.tsx

components/layout/
└── Navbar.tsx              ← belum ada state login
```

---

## Poin 1 — Pecah `dashboard/page.tsx` ke Route Terpisah [SEBAGIAN SELESAI]

Dashboard seller saat ini menggabungkan stats, kelola produk, dan pengaturan toko dalam satu file. Pecah menjadi tiga route terpisah di bawah `app/seller/`.

### Target struktur:

```
app/seller/
├── layout.tsx              ← tidak diubah
├── dashboard/
│   └── page.tsx            ← hanya tampilkan: header toko, toggle buka/tutup, DashboardStats, dan card shortcut ke /products dan /orders
├── products/
│   └── page.tsx            ← pindahkan logika ProductTable + AddProductDialog dari dashboard
└── settings/
    └── page.tsx            ← pindahkan logika StoreSettings dari dashboard
```

### Langkah konkret:

**`app/seller/dashboard/page.tsx` (setelah direfaktor):**
- Pertahankan: `fetchInitialData`, `handleToggleOpen`, `checkAndTriggerIsOpen`, `DashboardStats`
- Hapus: semua kode terkait `products` state, `ProductTable`, `AddProductDialog`, `StoreSettings`
- Ganti section produk dan settings dengan card/link navigasi ke `/seller/products` dan `/seller/settings`

**`app/seller/products/page.tsx` (baru):**
- Salin logika `fetchProducts`, `handleToggleAvailability`, state `products` dan `togglingProductId` dari `dashboard/page.tsx`
- Render: `ProductTable` + `AddProductDialog`
- Fetch `store_id` dari Supabase (`stores` table, filter `owner_id`) di awal — sama seperti yang dilakukan `fetchInitialData` di dashboard

**`app/seller/settings/page.tsx` (baru):**
- Salin logika fetch `storeData` dari `fetchInitialData`
- Render: `StoreSettings` dengan props yang sama seperti sekarang di dashboard

### Catatan penting:
- Ketiga page perlu fetch `user` dan `store` secara independen — tidak ada shared state antar route di Next.js App Router
- Gunakan pattern yang sama persis dengan `fetchInitialData` yang sudah ada di `dashboard/page.tsx`
- `SellerSidebar` di `components/seller/SellerSidebar.tsx` sudah exist — pastikan link-nya mengarah ke `/seller/dashboard`, `/seller/products`, `/seller/orders`, `/seller/settings`

---

## Poin 2 — Update `components/layout/Navbar.tsx`

### Kondisi saat ini:
`Navbar.tsx` selalu menampilkan tombol "Jadi Seller" (`/seller/dashboard`) tanpa mengecek status login user.

### Yang perlu dilakukan:

1. Tambahkan client-side check status auth Supabase menggunakan `supabase.auth.getUser()` atau `onAuthStateChange` di dalam `useEffect`
2. Simpan hasilnya ke local state, contoh: `const [user, setUser] = useState(null)`
3. Kondisikan tampilan:
   - **Jika user sudah login:** Ganti tombol "Jadi Seller" dengan elemen profil — bisa inisial nama/email dalam `Avatar`, atau `DropdownMenu` berisi link ke Dashboard dan tombol Logout
   - **Jika belum login:** Tetap tampilkan tombol "Jadi Seller" seperti sekarang

4. Gunakan `supabase` client dari `@/lib/supabase` (sudah dipakai di seluruh project, konsisten)

### Contoh struktur kondisional (pseudocode):
```tsx
{user ? (
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Avatar>{/* inisial dari user.email */}</Avatar>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem asChild><Link href="/seller/dashboard">Dashboard</Link></DropdownMenuItem>
      <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  <Link href="/seller/dashboard">
    <Button variant="ghost" size="sm">Jadi Seller</Button>
  </Link>
)}
```

---

## Poin 3 — Konfigurasi Cookie Session Supabase

### Kondisi saat ini:
Project menggunakan dua pendekatan Supabase client: `@/lib/supabase` (browser client) dan `utils/supabase/` (server-side dengan middleware). Middleware auth sudah ada di `utils/supabase/middleware.ts`.

### Yang perlu dilakukan:

Di `utils/supabase/middleware.ts`, tambahkan konfigurasi `cookieOptions` saat membuat client:

```ts
cookieOptions: {
  maxAge: 172800, // 48 jam dalam detik
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
}
```

Pastikan middleware sudah dijalankan pada semua route `/seller/*` — cek `matcher` di `middleware.ts` root project. Jika belum ada, tambahkan:

```ts
export const config = {
  matcher: ['/seller/:path*']
}
```

### Efek yang diharapkan:
Setelah 48 jam, session otomatis expired dan user diarahkan kembali ke `/login` saat mencoba mengakses route seller.

---

## Poin 4 — Fitur Logout

### Yang perlu dilakukan:

**Di `components/seller/SellerSidebar.tsx`:**
- Tambahkan tombol Logout di bagian bawah sidebar
- Implementasi:
  ```ts
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }
  ```
- Gunakan `supabase` dari `@/lib/supabase` dan `useRouter` dari `next/navigation`

**Di `components/layout/Navbar.tsx`:**
- Logout sudah tercakup di Poin 2 via `DropdownMenu` — cukup satu implementasi `handleLogout` yang sama

---

## Checklist

- [ ] **Poin 1:** Buat `app/seller/products/page.tsx` — pindahkan logika produk dari dashboard
- [ ] **Poin 1:** Buat `app/seller/settings/page.tsx` — pindahkan logika StoreSettings dari dashboard
- [ ] **Poin 1:** Refaktor `app/seller/dashboard/page.tsx` — hapus section produk & settings, ganti dengan navigasi card
- [ ] **Poin 1:** Pastikan `SellerSidebar.tsx` link-nya sudah mengarah ke route yang baru
- [ ] **Poin 2:** Update `Navbar.tsx` — tambahkan auth state check dan tampilan kondisional
- [ ] **Poin 3:** Update `utils/supabase/middleware.ts` — tambahkan `cookieOptions` dan pastikan matcher mencakup `/seller/*`
- [ ] **Poin 4:** Tambahkan tombol Logout di `SellerSidebar.tsx` dengan redirect ke `/`
