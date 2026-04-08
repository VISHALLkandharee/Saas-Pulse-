import React from "react";
import { Activity } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 rounded-full animate-pulse" />
        <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center relative shadow-2xl">
          <Activity className="text-emerald-500 animate-bounce" size={32} />
        </div>
      </div>
      
      <div className="space-y-2 animate-pulse">
        <h3 className="text-lg font-bold tracking-tight text-white">Loading Pulse...</h3>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-black">
          Securing Data Link
        </p>
      </div>

      <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 w-1/3 rounded-full animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
      </div>
    </div>
  );
}
