"use client"

import React, { useState } from "react";
import Link from "next/link";
import { Activity, Shield, Zap, MoveRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/Auth_Context";

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 overflow-hidden">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <Activity className="text-emerald-500" />
          <span className="font-bold text-xl tracking-tight">SaaS Pulse</span>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex gap-8 items-center text-sm font-medium text-zinc-400"
        >
          <Link href="/dashboard" className="hover:text-emerald-500 transition-colors">Dashboard</Link>
          <Link href="/login" className="bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-all transform active:scale-95">Sign In</Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-24 pb-32 text-center relative">
        {/* Decorative Background Pulse */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 blur-[120px] -z-10 rounded-full animate-pulse" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs font-medium text-emerald-400 mb-8 border-glow"
        >
          <Zap size={14} className="animate-bounce" />
          <span>v1.0 is now live</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent leading-tight"
        >
          Track your startup&apos;s <br /> heartbeat in real-time.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The all-in-one command center for SaaS founders. 
          Monitor revenue, user behavior, and system health with a single, high-performance pulse.
        </motion.p>

        {/* Waitlist / Action Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl mx-auto"
        >
          <WaitlistSection />
        </motion.div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-32 text-left">
          <FeatureCard 
            index={0}
            icon={<TrendingUpIcon />} 
            title="Revenue Tracking" 
            description="Automatic MRR and Churn calculations with no manual configuration required."
          />
          <FeatureCard 
            index={1}
            icon={<Shield size={24} className="text-blue-500" />} 
            title="Enterprise Security" 
            description="Custom JWT flows and Role-Based Access Control out of the box."
          />
          <FeatureCard 
            index={2}
            icon={<Activity size={24} className="text-rose-500" />} 
            title="Live Activity Feed" 
            description="See every user signup and upgrade as they happen with zero latency."
          />
        </div>
      </main>

      <style jsx>{`
        .border-glow {
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.1);
        }
      `}</style>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

function FeatureCard({ icon, title, description, index }: FeatureCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + (index * 0.1) }}
      whileHover={{ y: -10 }}
      className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl hover:border-emerald-500/30 transition-all group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
      <div className="mb-4 bg-black w-12 h-12 flex items-center justify-center rounded-2xl border border-zinc-800 group-hover:border-emerald-500/50 transition-colors shadow-xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-400 transition-colors">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TrendingUpIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function WaitlistSection() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  if (user) {
    return (
      <div className="flex justify-center mt-12">
        <Link 
          href="/dashboard" 
          className="group bg-emerald-500 text-black px-10 py-5 rounded-full font-bold flex items-center gap-2 hover:bg-emerald-400 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-emerald-500/20"
        >
          Go to Dashboard
          <MoveRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    );
  }

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch('/api_server/auth/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: data.message });
        setEmail("");
      } else {
        setStatus({ type: 'error', message: data.message || "Failed to join waitlist" });
      }
    } catch (err) {
      setStatus({ type: 'error', message: "Connection error. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10">
      <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        <div className="relative w-full sm:w-80 text-left">
          <input 
            type="email" 
            placeholder="Enter your email to join the waitlist" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-emerald-500/50 transition-all text-sm backdrop-blur-sm"
          />
        </div>
        <button 
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all transform active:scale-95 disabled:opacity-50 whitespace-nowrap shadow-xl shadow-white/5"
        >
          {loading ? "Joining..." : "Get Early Access"}
          {!loading && <MoveRight size={18} />}
        </button>
      </form>
      
      {status && (
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-sm mt-4 font-medium ${status.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}
        >
          {status.message}
        </motion.p>
      )}

      <div className="mt-8 flex items-center justify-center gap-8 text-zinc-500 text-sm font-medium">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-emerald-500/50" />
          <span>Private Beta</span>
        </div>
        <div className="w-[1px] h-4 bg-zinc-800" />
        <Link href="/login" className="hover:text-white transition-colors">Registered? Sign In</Link>
      </div>
    </div>
  );
}