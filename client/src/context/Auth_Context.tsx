"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

interface Subscription {
  id: string;
  plan: "FREE" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELLED" | "EXPIRED";
  mrr: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  Role: string;
  image?: string | null;
  subscription?: Subscription | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = React.useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/profile");
      setUser(response.data.user);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      setUser(null);
      // 🛑 Critical Fix: If the token is invalid (401), we MUST clear the session 
      // otherwise Next.js Middleware will trap the user in an infinite redirect loop.
      if (axiosError.response?.status === 401) {
        console.warn("[AUTH] Stale session or blocked cookie detected.");
        
        if (typeof window !== "undefined") {
          const path = window.location.pathname;
          // Only redirect if we are actually in a protected area like /dashboard or /admin
          const isProtected = path.startsWith("/dashboard") || path.startsWith("/admin");
          
          if (isProtected) {
            setUser(null);
            router.replace("/login"); 
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      // 1. Tell the server to flush cookies and wait for it
      // This was being skipped/cancelled before
      await api.get("/auth/logout");
    } catch (error) {
      console.error("Server logout failed, forcing local cleanup:", error);
    } finally {
      // 2. Clear local data
      setUser(null);
      // 3. Clear memory and refresh state
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
