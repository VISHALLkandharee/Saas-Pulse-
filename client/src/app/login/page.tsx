"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Activity, Lock, Mail, MoveRight, Github, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/Auth_Context";

function LoginFormContent() {
  const { login: setAuthUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "auth_denied") {
        setError("GitHub authentication was cancelled or access was denied.");
      } else if (errorParam === "auth_failed") {
        setError("GitHub sign-in could not be completed. Please try again.");
      } else {
        try {
          setError(decodeURIComponent(errorParam));
        } catch {
          setError(errorParam);
        }
      }
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      setAuthUser(response.data.user);
      router.push("/dashboard");
      router.refresh(); 
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center mb-4 group">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
              <Activity className="text-emerald-400" size={32} />
            </div>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-zinc-400 mt-2 text-sm">Sign in to your dashboard to monitor your pulse.</p>
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm p-4 rounded-2xl flex items-start justify-between gap-3 overflow-hidden shadow-lg shadow-rose-950/20"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-rose-400/70 hover:text-rose-300 p-0.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="founder@example.com"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-400 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors text-white placeholder:text-zinc-600"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-semibold text-sm py-3.5 rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-3 cursor-pointer shadow-md shadow-white/5"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
            {!loading && <MoveRight size={17} />}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 text-zinc-600">
          <div className="h-[1px] flex-1 bg-zinc-800/60" />
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">Or continue with</span>
          <div className="h-[1px] flex-1 bg-zinc-800/60" />
        </div>

        <div className="grid grid-cols-1 mt-6">
          <a 
            href="/api_server/auth/github"
            className="flex items-center justify-center gap-3 bg-zinc-900/90 border border-zinc-800 py-3.5 rounded-2xl hover:bg-zinc-800 hover:border-zinc-700 transition-all text-sm font-medium cursor-pointer active:scale-95 text-zinc-200"
          >
            <Github size={19} />
            <span>Continue with GitHub</span>
          </a>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-white hover:text-emerald-400 font-medium transition-colors">
            Create an Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <LoginFormContent />
    </Suspense>
  );
}
