"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  ArrowLeft, 
  Key, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  ShieldAlert,
  Puzzle,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export default function DevelopersPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const response = await api.get("/keys");
      setKeys(response.data.apiKeys);
    } catch (error) {
      console.error("Failed to fetch keys", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleGenerate = async () => {
    try {
      setIsCreating(true);
      await api.post("/keys/generate", { name: newKeyName || "Production Key" });
      setNewKeyName("");
      fetchKeys();
    } catch (error) {
      console.error("Failed to generate key", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will immediately invalidate this key!")) return;
    try {
      await api.delete(`/keys/${id}`);
      fetchKeys();
    } catch (error) {
      console.error("Failed to delete key", error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
      <p className="text-zinc-500 animate-pulse text-sm">Initializing Developer Vault...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <Code2 className="text-emerald-500" />
                Developer Influx
              </h1>
              <p className="text-zinc-500 text-sm mt-1">Generate API keys to pipe real-time events into your Pulse.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Key Management */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Create New Key */}
            <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl backdrop-blur-md shadow-xl border-dashed border-2 hover:border-zinc-700 transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Zap size={18} className="text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold">New Pulse Connection</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g. My Next.js SaaS Production"
                    className="flex-1 bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all w-full"
                  />
                  <button 
                    onClick={handleGenerate}
                    disabled={isCreating}
                    className="bg-white text-black px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-white/5 w-full sm:w-auto"
                  >
                    {isCreating ? <div className="w-4 h-4 border-2 border-zinc-400 border-t-black rounded-full animate-spin" /> : <Plus size={18} />}
                    Generate Key
                  </button>
                </div>
              </div>
            </div>

            {/* Keys List */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 ml-1">Active Integration Keys</h3>
              <AnimatePresence mode="popLayout">
                {keys.map((key, idx) => (
                  <motion.div 
                    key={key.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-all shadow-lg"
                  >
                    <div className="space-y-3 w-full sm:flex-1">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-2">
                        <span className="font-bold text-zinc-200 truncate">{key.name}</span>
                        <span className="text-[9px] bg-zinc-800/50 px-2 py-0.5 rounded text-zinc-500 font-mono w-fit border border-zinc-800/50">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full">
                        <div className="bg-zinc-950 border border-zinc-800 px-3 py-2 rounded-xl font-mono text-xs text-emerald-500/80 flex-1 truncate select-all">
                          {key.key}
                        </div>
                        <button 
                          onClick={() => copyToClipboard(key.key, key.id)}
                          className="p-2.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all shadow-sm shrink-0"
                          title="Copy Key"
                        >
                          {copiedId === key.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDelete(key.id)}
                      className="p-2.5 text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100 self-end sm:self-center border border-transparent hover:border-rose-500/20"
                      title="Revoke Key"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {keys.length === 0 && (
                <div className="py-12 border-2 border-dashed border-zinc-900 rounded-2xl text-center text-zinc-600 italic text-sm">
                  No active keys found. Generate one to start tracking.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Documentation Snippet */}
          <div className="space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-3xl space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Puzzle size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Quick Setup</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Paste this into your backend to track an event.
              </p>
              
              <div className="bg-zinc-950 rounded-2xl p-4 border border-zinc-800/50 font-mono text-[11px] text-zinc-400 space-y-2 overflow-x-auto">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2">
                  <span className="text-zinc-600">POST /api/v1/event</span>
                  <Terminal size={12} className="text-zinc-700" />
                </div>
                {/* The actual fetch snippet code */}
                <div className="relative group">
                  <button 
                    onClick={() => {
                      const code = `fetch('${(process.env.NEXT_PUBLIC_RAILWAY_URL || 'https://saas-pulse-production.up.railway.app')}/api/v1/event', {
  method: 'POST',
  headers: {
    'x-api-key': '${keys[0]?.key || 'YOUR_SP_KEY'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event: 'USER_SIGNUP',
    metadata: { plan: 'PRO' }
  })
});`;
                      navigator.clipboard.writeText(code);
                      const btn = document.getElementById('copy-setup-btn');
                      if (btn) {
                        btn.innerText = 'Copied!';
                        setTimeout(() => btn.innerText = 'Copy', 2000);
                      }
                    }}
                    id="copy-setup-btn"
                    className="absolute top-0 right-0 py-1 px-3 bg-zinc-800 text-[10px] text-zinc-400 rounded-lg border border-zinc-700 opacity-0 group-hover:opacity-100 transition-all hover:bg-zinc-700 hover:text-white"
                  >
                    Copy
                  </button>
                  <div className="text-emerald-500/70">{`fetch('${(process.env.NEXT_PUBLIC_RAILWAY_URL || 'https://saas-pulse-production.up.railway.app')}/api/v1/event', {`}</div>
                  <div className="pl-4 text-zinc-400">{`method: 'POST',`}</div>
                  <div className="pl-4 text-zinc-400">{`headers: {`}</div>
                  <div className="pl-8 text-emerald-400">{`'x-api-key': '${keys[0]?.key || 'YOUR_SP_KEY'}',`}</div>
                  <div className="pl-8 text-zinc-400">{`'Content-Type': 'application/json'`}</div>
                  <div className="pl-4 text-zinc-400">{`},`}</div>
                  <div className="pl-4 text-zinc-400">{`body: JSON.stringify({`}</div>
                  <div className="pl-8 text-amber-400">{`event: 'USER_SIGNUP',`}</div>
                  <div className="pl-8 text-zinc-400">{`metadata: { plan: 'PRO' }`}</div>
                  <div className="pl-4 text-zinc-400">{`})`}</div>
                  <div className="text-emerald-500/70">{`});`}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800 mt-4 flex items-start gap-3">
                <ShieldAlert size={16} className="text-rose-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-500 italic leading-tight">
                  Always keep your keys secret. Never expose them in your frontend code. Pulse responsibly.
                </p>
              </div>
            </div>

            <div className="p-8 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
              
              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-amber-500/10 p-2 rounded-xl text-amber-500">
                    <ShieldAlert size={20} />
                  </div>
                  <h3 className="text-xl font-bold">Metadata Dictionary</h3>
                </div>

                <p className="text-sm text-zinc-500 mb-8 max-w-lg leading-relaxed">
                  Your dashboard automatically calculates growth based on specific keys in your <code className="text-zinc-300">metadata</code> object.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Revenue Tracking */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                       Revenue Tracking
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <code className="text-emerald-400 text-xs">mrr</code>
                        <span className="text-[10px] text-zinc-500">Monthly Recurring Revenue</span>
                      </li>
                      <li className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <code className="text-emerald-400 text-xs">amount</code>
                        <span className="text-[10px] text-zinc-500">Transaction Value</span>
                      </li>
                      <li className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <code className="text-emerald-400 text-xs">value</code>
                        <span className="text-[10px] text-zinc-500">General Numeric Worth</span>
                      </li>
                    </ul>
                  </div>

                  {/* Identity Tracking */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                       Identity Tracking
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <code className="text-indigo-400 text-xs">customer</code>
                        <span className="text-[10px] text-zinc-500">Full Name or Alias</span>
                      </li>
                      <li className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <code className="text-indigo-400 text-xs">customerId</code>
                        <span className="text-[10px] text-zinc-500">Unique Database ID</span>
                      </li>
                      <li className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                        <code className="text-indigo-400 text-xs">email</code>
                        <span className="text-[10px] text-zinc-500">Direct Contact Address</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                  <p className="text-[11px] text-zinc-400 leading-relaxed italic">
                    💡 <span className="text-emerald-500 font-bold">Pro Tip:</span> Always send at least one <strong>Identity key</strong> with every pulse. This ensures your "Active Customers" count stays perfectly accurate even if your users are making thousands of requests.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl space-y-2">
              <h4 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <Key size={14} className="text-indigo-400" />
                SDK coming soon
              </h4>
              <p className="text-xs text-zinc-500">
                We&apos;re building a dedicated library for Node.js, Go, and Python. Stay tuned!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
