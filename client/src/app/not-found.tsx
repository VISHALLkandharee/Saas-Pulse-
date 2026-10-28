"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Activity, ArrowLeft, Home, LayoutDashboard, Compass } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-between p-6 relative overflow-hidden select-none">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Subtle background grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top Navbar Brand */}
      <header className="w-full max-w-6xl py-4 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
            <Activity className="text-emerald-400" size={20} />
          </div>
          <span className="font-bold tracking-tight text-lg text-white">
            SaaS <span className="text-emerald-400">Pulse</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-900/60 border border-zinc-800/80 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          SYSTEM STATUS: HEALTHY
        </div>
      </header>

      {/* Main 404 Hero Section */}
      <main className="w-full max-w-2xl text-center my-auto py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          {/* Animated 404 pill badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-6">
            <Compass size={14} className="animate-spin" style={{ animationDuration: "12s" }} />
            Error 404 • Destination Lost
          </div>

          {/* Big Stylized 404 Heading */}
          <h1 className="text-8xl sm:text-9xl font-black tracking-tighter bg-gradient-to-b from-white via-zinc-200 to-zinc-600 bg-clip-text text-transparent mb-4 leading-none select-none">
            404
          </h1>

          {/* Subheading & Explanation */}
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3">
            We couldn&apos;t find that pulse.
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto mb-10 leading-relaxed">
            The page you requested doesn&apos;t exist, was moved to a new route, or the URL might have a typo.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm py-3.5 px-6 rounded-2xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.4)] active:scale-95"
            >
              <LayoutDashboard size={18} />
              Open Dashboard
            </Link>

            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-medium text-sm py-3.5 px-5 rounded-2xl transition-all hover:border-zinc-700 active:scale-95"
            >
              <Home size={18} />
              Home
            </Link>

            <button
              onClick={() => router.back()}
              type="button"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 font-medium text-sm py-3.5 px-4 rounded-2xl transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft size={17} />
              Back
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer Navigation */}
      <footer className="w-full max-w-6xl py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 border-t border-zinc-900/80 relative z-10">
        <div>
          &copy; {new Date().getFullYear()} SaaS Pulse Inc. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="hover:text-zinc-300 transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="hover:text-zinc-300 transition-colors">
            Register
          </Link>
          <a 
            href="mailto:support@vishallkumar.com" 
            className="hover:text-emerald-400 transition-colors"
          >
            Report an Issue
          </a>
        </div>
      </footer>
    </div>
  );
}
