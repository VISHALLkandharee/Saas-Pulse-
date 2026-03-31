"use client";

import { CheckCircle2, Zap, Shield, Crown, ArrowRight, Loader2, PartyPopper } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/Auth_Context";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for initial MVP validation.",
    features: [
      "1,000 pulses per month",
      "7-day data retention",
      "1 API Integration key",
      "Basic dashboard monitoring",
    ],
    button: "Current Plan",
    disabled: true,
    accent: "zinc",
  },
  {
    name: "Pro",
    price: "$29",
    description: "For active startups scaling fast.",
    features: [
      "50,000 pulses per month",
      "90-day data retention",
      "5 API Integration keys",
      "Advanced revenue charts",
      "Email activity alerts",
    ],
    button: "Upgrade to Pro",
    plan: "PRO",
    accent: "emerald",
  },
  {
    name: "Enterprise",
    price: "$99",
    description: "For established business platforms.",
    features: [
      "Unlimited monthly pulses",
      "Lifetime data retention",
      "Unlimited API keys",
      "Team collaboration tools",
      "Custom webhook exports",
      "Priority founder support",
    ],
    button: "Go Enterprise",
    plan: "ENTERPRISE",
    accent: "indigo",
  },
];

function BillingContent() {
  const { user, checkAuth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (searchParams?.get("success")) {
      setShowSuccess(true);
      checkAuth(); // Refresh profile to get NEW subscription status
      // Clean up URL to prevent showing success again on refresh
      window.history.replaceState({}, "", "/dashboard/billing");
    }
  }, [searchParams, checkAuth]);

  const handleUpgrade = async (plan: string) => {
    setLoadingPlan(plan);
    try {
      const response = await api.post("/subscriptions/checkout", { plan });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Billing Error:", error);
      alert("Billing service unavailable. Please try again later.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setLoadingPlan("portal");
    try {
      const response = await api.post("/subscriptions/portal");
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error("Portal Error:", error);
      alert("Subscription management unavailable.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 p-8 pt-24 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Success Modal */}
        <AnimatePresence>
          {showSuccess && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-zinc-900 border border-emerald-500/30 p-8 rounded-[2.5rem] max-w-md w-full text-center space-y-6 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
              >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <PartyPopper className="text-emerald-500" size={40} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white tracking-tighter">Plan Upgraded!</h2>
                  <p className="text-zinc-400 font-medium">Your subscription is now active. Limits have been increased across the board.</p>
                </div>
                <button 
                  onClick={() => {
                    setShowSuccess(false);
                    router.push("/dashboard");
                  }}
                  className="w-full py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-sm"
                >
                  Let's Go!
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Header */}
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tighter"
          >
            Upgrade Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Pulse.</span>
          </motion.h1>
          <p className="text-zinc-500 max-w-xl mx-auto text-lg">
            Choose a plan that matches your business velocity.
          </p>
        </div>

        {/* Current Plan Status */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${user?.subscription?.plan === 'FREE' ? 'bg-zinc-800 text-zinc-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <Zap size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest leading-none">Your Current Tier</p>
              <h3 className="text-xl font-bold text-white mt-1 uppercase tracking-tighter">{user?.subscription?.plan || "FREE"} PLAN</h3>
            </div>
          </div>
          
          {user?.subscription?.plan !== 'FREE' && (
            <button 
              onClick={handlePortal}
              disabled={!!loadingPlan}
              className="px-6 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800/50 text-white font-bold text-sm hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loadingPlan === 'portal' ? <Loader2 size={16} className="animate-spin" /> : "Manage Billing"}
            </button>
          )}
        </div>

        {/* Tiers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, idx) => {
            const isCurrent = user?.subscription?.plan === tier.plan || (tier.name === "Free" && user?.subscription?.plan === "FREE");
            
            return (
              <motion.div 
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className={`relative group bg-zinc-900/30 border ${isCurrent ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-zinc-800'} rounded-3xl p-8 flex flex-col hover:border-zinc-700 transition-all overflow-hidden`}
              >
                {tier.plan === "PRO" && (
                  <div className="absolute top-0 right-0 px-4 py-1 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                    Popular
                  </div>
                )}

                <div className="space-y-4 mb-8">
                  <h3 className="text-xl font-bold text-white tracking-tighter">{tier.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{tier.price}</span>
                    <span className="text-zinc-500 text-sm font-medium">/month</span>
                  </div>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4 flex-1 mb-8">
                  {tier.features.map(feature => (
                    <div key={feature} className="flex items-start gap-3 text-sm text-zinc-400">
                      <CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => tier.plan && handleUpgrade(tier.plan)}
                  disabled={!!loadingPlan || isCurrent || tier.disabled}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                    isCurrent 
                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default"
                      : tier.accent === "emerald"
                      ? "bg-white text-black hover:bg-emerald-50 scale-100 hover:scale-[1.02] shadow-xl hover:shadow-emerald-500/20"
                      : tier.accent === "indigo"
                      ? "bg-indigo-600 text-white hover:bg-indigo-500"
                      : "bg-zinc-800 text-zinc-500"
                  } disabled:opacity-50`}
                >
                  {loadingPlan === tier.plan ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      {isCurrent ? "Current Plan" : tier.button}
                      {!isCurrent && tier.plan && <ArrowRight size={18} />}
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Security / Quality Check */}
        <p className="text-center text-zinc-600 text-[10px] uppercase font-bold tracking-[0.2em] pt-8">
          Enterprise Security • PCI Compliant • 256-Bit SSL
        </p>

      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
