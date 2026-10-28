"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Activity } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CRITICAL] Uncaught application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-between p-6 relative overflow-hidden select-none">
      {/* Background ambient red/rose glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl py-4 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
            <Activity className="text-emerald-400" size={20} />
          </div>
          <span className="font-bold tracking-tight text-lg text-white">
            SaaS <span className="text-emerald-400">Pulse</span>
          </span>
        </Link>
      </header>

      {/* Main Error Hero */}
      <main className="w-full max-w-xl text-center my-auto py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center"
        >
          {/* Warning Icon with pulse ring */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full" />
            <div className="relative bg-rose-500/10 p-4 rounded-3xl border border-rose-500/30 text-rose-400">
              <AlertTriangle size={42} />
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
            System Alert • Unexpected Interruption
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Something went off track
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
            We encountered an unexpected issue while rendering this page. Our team has been notified, and you can try recovering below.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
            <button
              onClick={() => reset()}
              type="button"
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-200 text-black font-semibold text-sm py-3.5 px-6 rounded-2xl transition-all active:scale-95 cursor-pointer shadow-lg shadow-white/5"
            >
              <RefreshCw size={17} />
              Try Again
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-medium text-sm py-3.5 px-5 rounded-2xl transition-all active:scale-95"
            >
              <Home size={17} />
              Return Home
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl py-6 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-900/80 relative z-10">
        <div>&copy; {new Date().getFullYear()} SaaS Pulse Inc.</div>
        <a 
          href="mailto:support@vishallkumar.com"
          className="hover:text-zinc-400 transition-colors"
        >
          Contact Support
        </a>
      </footer>
    </div>
  );
}
