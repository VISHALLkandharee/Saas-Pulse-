"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { Activity, Lock, Mail, User, MoveRight, ShieldCheck, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/Auth_Context";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invitationEmail = searchParams.get("email");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [adminId, setAdminId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdminField, setShowAdminField] = useState(false);
  
  const { login: setAuthUser } = useAuth();

  // 🕊️ VIP Pre-fill: If they came from an invite link, fill their email automatically
  useEffect(() => {
    if (invitationEmail) {
      setEmail(decodeURIComponent(invitationEmail));
    }
  }, [invitationEmail]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (adminId) formData.append("adminId", adminId);
      if (imageFile) formData.append("image", imageFile);

      const response = await api.post("/auth/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setAuthUser(response.data.user);
      router.push("/dashboard");
      router.refresh(); 
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Registration failed. Please try again.");
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
          <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="text-zinc-500 mt-2 text-sm">Start tracking your SaaS pulse in minutes.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">Profile Picture (Optional)</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-emerald-500 transition-colors pointer-events-none">
                <ImageIcon size={18} />
              </div>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-emerald-500/50 transition-colors file:hidden cursor-pointer"
              />
              {!imageFile && (
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none">
                
                </span>
              )}
              {imageFile && (
                <span className="absolute left-12 top-1/2 -translate-y-1/2 text-emerald-500 font-medium pointer-events-none">
                  {imageFile.name}
                </span>
              )}
            </div>
          </div>

          {showAdminField ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-rose-500 ml-1">Admin Access Token</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" size={18} />
                <input 
                  type="text" 
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  placeholder="Enter Admin Pin"
                  className="w-full bg-zinc-900 border border-rose-500/30 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-rose-500/50 transition-colors"
                />
              </div>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setShowAdminField(true)}
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors ml-1"
            >
              Have an Admin Invite?
            </button>
          )}

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
            {loading ? "Creating Account..." : "Create Founder Account"}
            {!loading && <MoveRight size={18} />}
          </button>
        </form>

        <p className="text-center text-zinc-500 text-sm mt-8">
          Already have an account? <Link href="/login" className="text-white hover:text-emerald-400 transition-colors font-medium">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
}
