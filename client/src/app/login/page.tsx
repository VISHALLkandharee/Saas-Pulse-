"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Activity, Lock, Mail, MoveRight, Github } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/context/Auth_Context";

export default function LoginPage() {
  const { login: setAuthUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/login", { email, password });
      setAuthUser(response.data.user);
      // Explicitly push to dashboard to resolve the "stuck" issue
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
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20">
              <Activity className="text-emerald-500" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-zinc-500 mt-2 text-sm">Sign in to your dashboard to track your pulse.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="founder@example.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm p-4 rounded-xl text-center">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In to Dashboard"}
            {!loading && <MoveRight size={18} />}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 text-zinc-600">
          <div className="h-[1px] flex-1 bg-zinc-800/50" />
          <span className="text-xs font-medium uppercase tracking-widest">Or continue with</span>
          <div className="h-[1px] flex-1 bg-zinc-800/50" />
        </div>

        <div className="grid grid-cols-1 mt-6">
          <button className="flex items-center justify-center gap-3 bg-zinc-900 border border-zinc-800 py-3 rounded-2xl hover:bg-zinc-800 transition-colors">
            <Github size={20} />
            <span className="text-sm font-medium">Authentication with GitHub</span>
          </button>
        </div>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Don&apos;t have an account? <Link href="/register" className="text-white hover:text-emerald-400 transition-colors">Create an Account</Link>
        </p>
      </motion.div>
    </div>
  );
}
