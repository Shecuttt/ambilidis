"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

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
