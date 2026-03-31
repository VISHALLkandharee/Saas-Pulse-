"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
      // If the profile check fails with 401, we might be in an inconsistent state or the cookie is missing/invalid
      if (axiosError.response?.status === 401) {
        // Only redirect if we ARE NOT on login or register already
        const path = window.location.pathname;
        if (path !== "/login" && path !== "/register" && path !== "/") {
          router.push("/login");
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
      await api.get("/auth/logout");
    } catch (error) {
      console.error("Server logout failed", error);
    } finally {
      setUser(null);
      router.push("/login");
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
