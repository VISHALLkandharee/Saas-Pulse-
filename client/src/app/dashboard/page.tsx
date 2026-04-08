"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  TrendingUp, 
  Users, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Code2,
  Settings,
  Trash2,
  Zap,
  PartyPopper,
  Shield,
  Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RevenueChart from "@/components/dashboard/RevenueChart";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/Auth_Context";

import { io } from "socket.io-client";

interface ActivityItem {
  id: string;
  userId: string;
  event: string;
  userEmail: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  message?: string;
  isOwner?: boolean;
}

interface StatMetric {
  value: number | string;
  trend: number;
  label?: string;
}

interface RevenueDataPoint {
  month: string;
  revenue: number;
}

interface DashboardStats {
  mrr: StatMetric;
  activeSubscriptions: StatMetric;
  churnRate: StatMetric;
  usage?: {
    current: number;
    limit: number;
    percent: number;
  };
  apiKey?: string | null;
  hasIntegrated?: boolean;
  revenueHistory: RevenueDataPoint[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      className="p-1.5 hover:bg-zinc-800 rounded-md transition-all text-zinc-500 hover:text-emerald-500"
    >
      {copied ? <span className="text-[10px] font-bold uppercase">Copied!</span> : <RefreshCw size={14} />}
    </button>
  );
}

export default function DashboardPage() {
  const { user, logout: authLogout, checkAuth } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeToast, setActiveToast] = useState<ActivityItem | null>(null);
  const [filterOwnOnly, setFilterOwnOnly] = useState(false);

  // Use React Query for Stats
  const { data: stats, isLoading: statsLoading, isFetching: statsFetching } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/metrics/dashboard");
      return res.data.data;
    },
    enabled: !!user,
  });

  // Use React Query for Activities
  const { data: activities = [], isLoading: activityLoading, isFetching: activitiesFetching } = useQuery<ActivityItem[]>({
    queryKey: ["activities"],
    queryFn: async () => {
      const res = await api.get("/metrics/activities");
      return res.data.data;
    },
    enabled: !!user,
  });

  const loading = statsLoading || activityLoading;
  const isSyncing = statsFetching || activitiesFetching;

  useEffect(() => {
    if (!user) return;
    
    // Connect to Socket.io server
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000", {
      withCredentials: true,
      transports: ["websocket", "polling"],
      query: { userId: user?.id }
    });

    socket.on("connect", () => {
      console.log("[SOCKET] Connected to real-time feed:", socket.id);
    });

    // Handle new incoming pulses in real-time (Private Owner Room)
    socket.on("new-pulse", (newActivity: ActivityItem) => {
      console.log("[SOCKET] New private pulse received:", newActivity);
      
      const isOwner = newActivity.userId === user?.id;
      
      // Update cache manually for immediate feedback in the Feed
      queryClient.setQueryData(["activities"], (old: ActivityItem[] | undefined) => {
        return [newActivity, ...(old || [])].slice(0, 15);
      });
      
      // Invalidate stats if it's a high-level event
      if (["PLAN_UPGRADE", "NEW_SUBSCRIPTION"].includes(newActivity.event)) {
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      }
    });

    // Handle community-wide social proof (Anonymized)
    socket.on("community-pulse", (data: { event: string, message: string }) => {
      console.log("[SOCKET] Community toast received:", data);
      
      const toastWithContext: any = {
        id: Math.random().toString(),
        userId: "community",
        event: data.event,
        message: data.message,
        timestamp: new Date().toISOString(),
        userEmail: "Saas Pulse",
        isOwner: false
      };
      
      setActiveToast(toastWithContext);
      setTimeout(() => setActiveToast(null), 5000);
    });

    // Handle subscription status changes in real-time
    socket.on("subscription-updated", (data: { userId: string, plan: string }) => {
      if (data.userId === user?.id) {
        console.log("[SOCKET] Subscription updated, refreshing state...");
        checkAuth(); // Refresh global user plan state
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, checkAuth, queryClient]);

  const formatActivityMessage = (event: string): string => {
    switch (event) {
      case "USER_SIGNUP": return "Welcome to SaaS Pulse!";
      case "USER_LOGIN": return "Welcome back!";
      case "PLAN_UPGRADE": return "Subscription plan upgraded.";
      default: return `System event: ${event}`;
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
  };

  if (loading && !stats) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4 w-full md:w-auto">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}</h1>
              <p className="text-zinc-500 mt-1">Real-time business health monitoring.</p>
            </div>
            
            {stats?.usage && user?.Role !== 'ADMIN' && (
              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pulse Usage</span>
                  <span className={`text-[10px] font-black ${
                    stats.usage.percent > 80 ? 'text-rose-500' : stats.usage.percent > 50 ? 'text-orange-500' : 'text-emerald-500'
                  }`}>
                    {stats.usage.current.toLocaleString()} / {stats.usage.limit >= 999999999 ? '∞' : stats.usage.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.usage.percent}%` }}
                    className={`h-full ${
                      stats.usage.percent > 80 ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 
                      stats.usage.percent > 50 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]' : 
                      'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    }`}
                  />
                </div>
                {stats.usage.percent >= 80 && (
                  <p className="text-[9px] text-rose-400 font-bold uppercase tracking-tighter animate-pulse">
                    Approaching limit. <Link href="/dashboard/billing" className="underline">Upgrade now</Link>
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-start md:justify-end">
            {user?.Role === "ADMIN" && (
              <Link 
                href="/admin"
                className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-4 py-2 rounded-full transition-all border border-purple-500/20 font-bold uppercase tracking-wider flex items-center gap-2"
              >
                <Shield size={14} /> Founder Hub
              </Link>
            )}
            {user?.Role === "ADMIN" && (
              <Link href="/dashboard/users" className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-full transition-all border border-zinc-800 hover:border-zinc-700 font-bold uppercase tracking-wider">Manage Members</Link>
            )}
            <Link href="/dashboard/developers" className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full transition-all border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-2"><Code2 size={14} /> Developers</Link>
            <Link href="/dashboard/billing" className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full transition-all border border-emerald-500/20 font-bold uppercase tracking-wider flex items-center gap-2"><Zap size={14} /> Billing</Link>
            <Link href="/dashboard/settings" className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-full transition-all border border-zinc-800 hover:border-zinc-700 font-bold uppercase tracking-wider flex items-center gap-2"><Settings size={14} /> Settings</Link>
            <button onClick={authLogout} className="text-sm text-zinc-500 hover:text-white transition-colors">Sign Out</button>
            <button 
              onClick={handleRefresh} 
              className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-full transition-all border border-zinc-800 hover:border-zinc-700 font-bold uppercase tracking-wider flex items-center gap-2"
            >
              <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
              {/* {isSyncing ? "Syncing..." : "Refresh"} */}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title={stats?.mrr.label || "MRR"} value={`$${stats?.mrr.value ?? 0}`} trend={stats?.mrr.trend ?? 0} icon={<TrendingUp className="text-emerald-500" />} />
          <StatCard title={stats?.activeSubscriptions.label || "Active Subs"} value={stats?.activeSubscriptions.value ?? 0} trend={stats?.activeSubscriptions.trend ?? 0} icon={<Users className="text-blue-500" />} />
          <StatCard title={stats?.churnRate.label || "Churn"} value={`${stats?.churnRate.value ?? 0}%`} trend={stats?.churnRate.trend ?? 0} icon={<Activity className="text-rose-500" />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          { (stats?.hasIntegrated || activities.length > 0) ? (
            <>
              <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 min-h-[400px] flex flex-col relative group">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Revenue Growth
                    {user?.subscription?.plan === "FREE" && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold uppercase tracking-tighter">Pro Feature</span>
                    )}
                  </h3>
                </div>

                <div className="flex-1 w-full min-h-[300px] relative">
                  {/* The actual chart (Blurred if FREE and NOT ADMIN) */}
                  <div className={`w-full h-full transition-all duration-700 ${user?.subscription?.plan === "FREE" && user?.Role !== "ADMIN" ? "blur-md pointer-events-none grayscale opacity-40" : ""}`}>
                    <RevenueChart data={stats?.revenueHistory || []} />
                  </div>

                  {/* The Unlock Overlay (Only for FREE and NOT ADMIN) */}
                  {user?.subscription?.plan === "FREE" && user?.Role !== "ADMIN" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-zinc-950/20 backdrop-blur-[2px] rounded-xl">
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20 shadow-2xl">
                        <Lock className="text-white" size={20} />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-2">Advanced Revenue Insights</h4>
                      <p className="text-zinc-400 text-sm max-w-[280px] mb-6 leading-relaxed">
                        Upgrade to PRO to unlock detailed growth analytics and 90-day retention history.
                      </p>
                      <button 
                        onClick={() => router.push('/dashboard/billing')}
                        className="bg-white text-black px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
                      >
                        Unlock PRO Dashboard
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col h-[400px] lg:h-[600px]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-semibold">Live Pulse</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Activity Feed</p>
                  </div>
                  <button onClick={() => setFilterOwnOnly(!filterOwnOnly)} className={`text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full border transition-all ${filterOwnOnly ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}>{filterOwnOnly ? "My Pulse Only" : "All Activity"}</button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
                  {activities.filter(a => !filterOwnOnly || a.isOwner).map((activity, idx) => (
                    <motion.div 
                      key={activity.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                      className={`flex gap-4 items-start border-l-2 pl-4 pb-2 relative group ${activity.isOwner ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800'}`}
                    >
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                            {activity.message}
                            {activity.isOwner && <span className="text-[10px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-sm ml-2">Your Pulse</span>}
                          </p>
                          {(user?.Role === "ADMIN" || activity.isOwner) && (
                            <button onClick={async () => {
                              try {
                                // Optimistically update cache
                                queryClient.setQueryData(["activities"], (old: ActivityItem[] | undefined) => 
                                  old?.filter(a => a.id !== activity.id)
                                );
                                await api.delete(`/metrics/activities/${activity.id}`);
                              } catch (err) { handleRefresh(); }
                            }} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-500 rounded-md transition-all text-zinc-600"><Trash2 size={14} /></button>
                          )}
                        </div>
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                           <div className="flex flex-wrap gap-2 mt-1">
                             {Object.entries(activity.metadata).map(([key, value]) => (
                               <span key={key} className="text-[10px] bg-zinc-800/80 border border-zinc-700 text-zinc-400 px-2 py-1 rounded-md font-mono"><span className="text-zinc-500">{key}:</span> {String(value)}</span>
                             ))}
                           </div>
                        )}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-2 gap-1 text-[10px] text-zinc-600">
                          <span>{new Date(activity.timestamp).toLocaleString()}</span>
                          <span className="font-mono truncate max-w-[150px]">{activity.userEmail}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : !loading && stats ? (
            <div className="lg:col-span-3">
              <OnboardingCard apiKey={stats?.apiKey} />
            </div>
          ) : (
            <div className="lg:col-span-3 h-[400px] bg-zinc-900/50 rounded-2xl animate-pulse" />
          )}
        </div>

        <AnimatePresence>
          {activeToast && (
            <motion.div initial={{ opacity: 0, x: -50, y: 50, scale: 0.8 }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed bottom-8 left-8 z-[100] flex items-center gap-4 bg-zinc-900/90 border border-emerald-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-md min-w-[300px]">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0 border border-emerald-500/20"><PartyPopper className="text-emerald-500" size={24} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-0.5">Community Pulse</p>
                <p className="text-sm font-bold text-white leading-tight">{activeToast.message}</p>
              </div>
              <button onClick={() => setActiveToast(null)} className="absolute top-2 right-2 text-zinc-600 hover:text-white"><Trash2 size={12} /></button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: StatCardProps) {
  const isPositive = trend > 0;
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group shadow-lg">
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">{icon}</div>
      <p className="text-zinc-500 text-sm font-medium mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-bold">{value}</h2>
        <span className={`text-xs flex items-center ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>{isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(trend)}%</span>
      </div>
    </motion.div>
  );
}

interface StatCardProps { title: string; value: number | string; trend: number; icon: React.ReactNode; }

function OnboardingCard({ apiKey }: { apiKey?: string | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showKey, setShowKey] = useState(false);
  
  // Mutation to generate the first key manually
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/keys/generate", { name: "First Ingest Key" });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    }
  });

  const displayKey = apiKey || 'generate_to_see_key...';
  const curlExample = `curl -X POST ${(process.env.NEXT_PUBLIC_RAILWAY_URL || 'http://localhost:8000')}/api/v1/event -H "Content-Type: application/json" -H "x-api-key: ${apiKey || 'YOUR_API_KEY'}" -d '{"event": "NEW_SALE", "metadata": {"mrr": 49, "customer": "CUST_DEFAULT"}}'`;
  
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-zinc-900/50 border border-emerald-500/10 rounded-3xl p-8 md:p-12 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 opacity-5"><Zap size={200} /></div>
      <div className="max-w-2xl space-y-8 relative z-10">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 text-xs font-bold uppercase tracking-widest"><PartyPopper size={14} /> Welcome to the Pulse</div>
          <h2 className="text-4xl font-bold tracking-tight">Your first pulse is ready to be sent.</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">SaaS Pulse helps you track business health in real-time. Follow the steps below to connect your first application.</p>
        </div>

        {!apiKey ? (
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-8 rounded-2xl flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
              <Code2 className="text-emerald-500" size={32} />
            </div>
            <h3 className="text-xl font-bold">Step 1: Generate Credentials</h3>
            <p className="text-zinc-500 text-sm max-w-sm">Create your unique API key to securely ingest data from your backend or Stripe webhooks.</p>
            <button 
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-8 py-3 rounded-xl font-black transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {generateMutation.isPending ? "Generating..." : "Generate My Secret API Key"}
              {!generateMutation.isPending && <ArrowUpRight size={18} />}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Step 2: Your API Key</span>
                  <button 
                    onClick={() => setShowKey(!showKey)} 
                    className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase"
                  >
                    {showKey ? "Hide" : "Show"}
                  </button>
                </div>
                <CopyButton text={showKey ? displayKey : "YOUR_API_KEY"} />
              </div>
              <div className="bg-black/50 p-3 rounded-lg border border-zinc-800/50 font-mono text-emerald-500 text-sm overflow-hidden truncate">
                 {showKey ? displayKey : "••••••••••••••••••••••••••••"}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Step 3: Connect Your App (cURL)</span>
                <CopyButton text={curlExample} />
              </div>
              <pre className="text-[11px] font-mono text-zinc-400 overflow-x-auto p-4 bg-black/50 rounded-lg leading-relaxed custom-scrollbar">
                {curlExample}
              </pre>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={() => window.open('https://docs.saaspulse.com', '_blank')} 
            className="bg-white text-black border border-white/20 px-8 py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center gap-2 text-black"
          >
            Documentation <ArrowUpRight size={18} />
          </button>
          <Link 
             href="/dashboard/developers"
             className="text-zinc-400 hover:text-white text-sm font-semibold transition-colors"
          >
             Go to SDK Settings
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-12 w-48 bg-zinc-900 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[400px] bg-zinc-900 rounded-2xl" />
          <div className="h-[400px] bg-zinc-900 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
