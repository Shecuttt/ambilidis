import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string; // product_id
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

interface CartStore {
  storeId: string | null;
  items: CartItem[];
  /**
   * Tambah item ke keranjang.
   * Returns "conflict" jika produk dari toko berbeda dan keranjang tidak kosong.
   * Returns "added" jika berhasil.
   */
  addItem: (product: any, storeId: string) => "added" | "conflict";
  /**
   * Paksa tambah item: bersihkan keranjang lama lalu tambah item baru.
   * Dipakai setelah user konfirmasi dialog.
   */
  forceAddItem: (product: any, storeId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      storeId: null,
      items: [],

      addItem: (product, storeId) => {
        const state = get();

        // Conflict: keranjang tidak kosong dan dari toko berbeda
        if (state.storeId && state.storeId !== storeId && state.items.length > 0) {
          return "conflict";
        }

        set((s) => {
          const existingItem = s.items.find(item => item.id === product.id);
          if (existingItem) {
            return {
              ...s,
              items: s.items.map(item =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }
          return {
            storeId,
            items: [...s.items, {
              id: product.id,
              name: product.name,
              price: product.price,
              unit: product.unit,
              quantity: 1,
            }],
          };
        });

        return "added";
      },

      forceAddItem: (product, storeId) => {
        set({
          storeId,
          items: [{
            id: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            quantity: 1,
          }],
        });
      },

      removeItem: (productId) => set((state) => ({
        items: state.items.filter(item => item.id !== productId),
        storeId: state.items.length === 1 && state.items[0].id === productId ? null : state.storeId,
      })),

      updateQuantity: (productId, quantity) => set((state) => ({
        items: quantity === 0
          ? state.items.filter(item => item.id !== productId)
          : state.items.map(item => item.id === productId ? { ...item, quantity } : item),
        storeId: quantity === 0 && state.items.length === 1 ? null : state.storeId,
      })),

      clearCart: () => set({ storeId: null, items: [] }),

      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
