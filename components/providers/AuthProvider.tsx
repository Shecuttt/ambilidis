"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
  initialUser: any | null;
}

export const AuthProvider = ({ children, initialUser }: AuthProviderProps) => {
  const [user, setUser] = useState<any | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const router = useRouter();

  const [prevInitialUser, setPrevInitialUser] = useState(initialUser);

  // Clear cart if guest on first load to prevent stale state from previous guest sessions
  useEffect(() => {
    if (!initialUser) {
      useCartStore.getState().clearCart();
    }
  }, [initialUser]); // Run on mount or if initialUser status changes

  if (initialUser !== prevInitialUser) {
    setUser(initialUser);
    setPrevInitialUser(initialUser);
    setIsLoading(false);
  }

  useEffect(() => {
    // Listener untuk perubahan status auth (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Hanya log jika event-nya signifikan atau jika ada session yang ditemukan
      // Kita abaikan INITIAL_SESSION dengan user undefined karena itu normal pada arsitektur httpOnly cookies
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          setUser({ ...session.user, ...profile });
        } else {
          setUser(null);
        }
        router.refresh();
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        useCartStore.getState().clearCart();
        router.push('/');
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
