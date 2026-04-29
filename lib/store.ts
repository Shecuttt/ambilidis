import { create } from 'zustand';

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
  addItem: (product: any, storeId: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  storeId: null,
  items: [],
  
  addItem: (product, storeId) => set((state) => {
    // If adding from a different store, ask to clear cart or just clear it for MVP
    if (state.storeId && state.storeId !== storeId) {
      if (!window.confirm("Pesan dari toko berbeda? Keranjang belanja saat ini akan dihapus.")) {
        return state;
      }
      // Reset cart with new item
      return {
        storeId,
        items: [{
          id: product.id,
          name: product.name,
          price: product.price,
          unit: product.unit,
          quantity: 1
        }]
      };
    }

    const existingItem = state.items.find(item => item.id === product.id);
    if (existingItem) {
      return {
        ...state,
        items: state.items.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        )
      };
    }

    return {
      storeId,
      items: [...state.items, {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity: 1
      }]
    };
  }),

  removeItem: (productId) => set((state) => ({
    items: state.items.filter(item => item.id !== productId),
    // Reset storeId if cart is empty
    storeId: state.items.length === 1 && state.items[0].id === productId ? null : state.storeId
  })),

  updateQuantity: (productId, quantity) => set((state) => ({
    items: quantity === 0 
      ? state.items.filter(item => item.id !== productId)
      : state.items.map(item => item.id === productId ? { ...item, quantity } : item),
    storeId: quantity === 0 && state.items.length === 1 ? null : state.storeId
  })),

  clearCart: () => set({ storeId: null, items: [] }),

  getTotal: () => {
    return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
