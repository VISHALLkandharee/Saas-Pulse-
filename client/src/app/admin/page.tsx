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
  Zap,
  Shield,
  Search,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/Auth_Context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import RevenueChart from "@/components/dashboard/RevenueChart";

interface AdminStats {
  mrr: { value: number; trend: number; label: string };
  activeSubscriptions: { value: number; trend: number; label: string };
  churnRate: { value: number; trend: number; label: string };
  usersTotal: { value: number; label: string };
  revenueHistory: { month: string; revenue: number }[];
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.Role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Use Query for System Stats
  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await api.get("/metrics/dashboard");
      return res.data.data;
    },
    enabled: !!user && user.Role === "ADMIN",
  });

  // Use Mutation for Stripe Portal
  const portalMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/subscriptions/portal");
      return res.data;
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: () => {
      alert("Billing service unavailable.");
    }
  });

  const loading = statsLoading || portalMutation.isPending;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'saas_pulse_export.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      alert("Failed to export data. Please try again.");
    }
  };

  if (statsLoading) return <AdminSkeleton />;

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Founder Hub</h1>
              <p className="text-zinc-500 mt-1">System-wide performance & revenue control.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => router.push("/dashboard/users")}
              className="flex-1 md:flex-none justify-center bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-2 rounded-xl border border-zinc-800 flex items-center gap-2 font-bold transition-all text-sm"
            >
              <Users size={16} />
              Manage Users
            </button>
            <button 
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
              className="flex-1 md:flex-none justify-center bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-2 font-bold transition-all text-sm disabled:opacity-50"
            >
              <Zap size={16} />
              {portalMutation.isPending ? "Connecting..." : "Manage Billing"}
            </button>
            <button 
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 ml-auto md:ml-0"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* Admin Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total MRR" 
            value={`$${stats?.mrr.value.toLocaleString()}`} 
            trend={stats?.mrr.trend || 0} 
            icon={<TrendingUp className="text-emerald-500" />} 
          />
          <StatCard 
            title="Customers" 
            value={stats?.activeSubscriptions.value || 0} 
            trend={stats?.activeSubscriptions.trend || 0} 
            icon={<Zap className="text-amber-500" />} 
          />
          <StatCard 
            title="System Churn" 
            value={`${stats?.churnRate.value || 0}%`} 
            trend={stats?.churnRate.trend || 0} 
            icon={<Activity className="text-rose-500" />} 
          />
          <StatCard 
            title="Total Users" 
            value={stats?.usersTotal.value || 0} 
            trend={0} 
            icon={<Users className="text-blue-500" />} 
          />
        </div>

        {/* Global Revenue Chart */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 flex flex-col min-h-[450px] shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h3 className="text-xl font-bold">System Revenue Growth</h3>
            <div className="flex items-center gap-2 text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold uppercase shrink-0">
              <Shield size={12} />
              Founder Access
            </div>
          </div>
          <div className="flex-1 w-full" style={{ height: '350px' }}>
            <RevenueChart 
              key={stats?.revenueHistory?.length || 0}
              data={stats?.revenueHistory || []} 
            />
          </div>
        </div>

        {/* Tactical Shortcuts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group cursor-pointer" onClick={() => router.push('/dashboard/users')}>
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Search className="text-blue-400" size={20} />
            </div>
            <h4 className="font-bold mb-1">User Lookup</h4>
            <p className="text-xs text-zinc-500">Quickly find and inspect user pulse data.</p>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="text-purple-400" size={20} />
            </div>
            <h4 className="font-bold mb-1">System Health</h4>
            <p className="text-xs text-zinc-500">Global ingestion rates & database status.</p>
          </div>
          <div 
            className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 p-6 rounded-2xl hover:border-zinc-700 transition-all group cursor-pointer"
            onClick={handleExport}
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
            <h4 className="font-bold mb-1">Export Data</h4>
            <p className="text-xs text-zinc-500">Download system metrics as CSV/JSON.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, trend, icon }: { title: string; value: string | number; trend: number; icon: React.ReactNode }) {
  const isPositive = trend > 0;
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group shadow-lg"
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>
      <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-2">{title}</p>
      <div className="flex items-baseline gap-2">
        <h2 className="text-3xl font-bold">{value}</h2>
        {trend !== 0 && (
          <span className={`text-[10px] font-black flex items-center gap-0.5 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </motion.div>
  );
}

function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-[#050505] p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-10 w-64 bg-zinc-900 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-zinc-900 rounded-2xl" />)}
        </div>
        <div className="h-[450px] bg-zinc-900 rounded-2xl" />
      </div>
    </div>
  );
}
