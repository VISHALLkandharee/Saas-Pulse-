"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { 
  ArrowLeft,
  Search, 
  UserPlus, 
  Shield, 
  User as UserIcon,
  Mail,
  Calendar, 
  MoreVertical, 
  ExternalLink,
  Zap,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  Role: string;
  createdAt: string;
  subscription?: {
    plan: string;
    mrr: number;
    status: string;
  };
}

interface WaitlistEntry {
  id: string;
  email: string;
  status: string;
  createdAt: string;
}

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedWaitlistEmail, setSelectedWaitlistEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState("FREE");
  const [newMrr, setNewMrr] = useState<string | number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isGranting, setIsGranting] = useState(false);
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      setUsers(response.data.users);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaitlist = async () => {
    try {
      const response = await api.get("/admin/waitlist");
      // Only show PENDING entries in the dropdown
      setWaitlist(response.data.waitlist.filter((w: WaitlistEntry) => w.status === "PENDING"));
    } catch (error) {
      console.error("Failed to fetch waitlist", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchWaitlist();
  }, []);

  const handleUpdateClick = (user: User) => {
    setSelectedUser(user);
    setNewPlan(user.subscription?.plan || "FREE");
    setNewMrr(user.subscription?.mrr?.toString() || "0");
    setIsModalOpen(true);
  };

  const handleUpdateSubmit = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await api.patch("/subscriptions/update", {
        userId: selectedUser.id,
        plan: newPlan,
        mrr: Number(newMrr),
        status: "ACTIVE"
      });
      alert("Subscription updated successfully!");
      setIsModalOpen(false);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error("Failed to update subscription", error);
      alert("Failed to update subscription. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGrantAccess = async () => {
    if (!selectedWaitlistEmail) return;
    setIsGranting(true);
    try {
      await api.post("/admin/waitlist/invite", { email: selectedWaitlistEmail });
      alert(`Early Access granted to ${selectedWaitlistEmail}!`);
      setSelectedWaitlistEmail("");
      fetchWaitlist(); // Refresh waitlist
    } catch (error) {
      console.error("Failed to grant access", error);
      alert("Failed to grant early access. Please try again.");
    } finally {
      setIsGranting(false);
    }
  };

  const filteredUsers = users.filter((user: User) => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <div className="w-8 h-8 border-4 border-zinc-800 border-t-white rounded-full animate-spin"></div>
      <p className="text-zinc-500 animate-pulse text-sm">Synchronizing Member Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8 text-zinc-300">
        {/* Breadcrumbs / Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Member Management</h1>
            <p className="text-sm text-zinc-500">Manage and monitor your user base.</p>
          </div>
        </div>

        {/* Search & Filters & Waitlist */}
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 flex flex-col md:flex-row gap-4 items-center justify-between bg-zinc-900/30 p-4 rounded-xl border border-zinc-800 backdrop-blur-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition-all text-sm placeholder:text-zinc-700"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Zap size={14} className="text-amber-500" />
              <span>{users.length} Total Registered Users</span>
            </div>
          </div>

          {/* Waitlist Management Quick-Section */}
          <div className="w-full xl:w-[400px] flex gap-3 items-center bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-emerald-500/70 mb-1.5 ml-1">Early Access Request</label>
              <select 
                value={selectedWaitlistEmail}
                onChange={(e) => setSelectedWaitlistEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer text-zinc-300"
              >
                <option value="">{waitlist.length > 0 ? `Select Guest (${waitlist.length} waiting)` : "No pending requests"}</option>
                {waitlist.map(w => (
                  <option key={w.id} value={w.email}>{w.email}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleGrantAccess}
              disabled={!selectedWaitlistEmail || isGranting}
              className="mt-5 bg-white text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center gap-2 whitespace-nowrap shadow-xl shadow-white/5"
            >
              {isGranting ? <Loader2 className="animate-spin" size={14} /> : "Grant VIP"}
              {!isGranting && <Shield size={14} />}
            </button>
          </div>
        </div>

        {/* Members Table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Member</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Role</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Plan</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-zinc-400">
                {filteredUsers.map((user: User, idx: number) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={user.id} 
                    className="hover:bg-zinc-800/30 transition-all group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden">
                          {user.image ? (
                            <Image 
                              src={user.image} 
                              alt={user.name} 
                              width={40} 
                              height={40} 
                              unoptimized={user.image.startsWith('http://localhost') || user.image.startsWith('/')}
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <UserIcon size={20} className="text-zinc-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-zinc-200">{user.name}</p>
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 mt-0.5 font-medium">
                            <Mail size={12} className="text-zinc-600" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        user.Role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}>
                        {user.Role === 'ADMIN' && <Shield size={10} />}
                        {user.Role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-zinc-300">
                          {user.subscription?.plan || 'NONE'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-medium">
                          ${user.subscription?.mrr || 0}/mo
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-medium">
                        <Calendar size={12} className="text-zinc-600" />
                        <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleUpdateClick(user)}
                        className="p-2 hover:bg-zinc-800 rounded-lg transition-all text-zinc-600 hover:text-white border border-transparent hover:border-zinc-700"
                      >
                        <Shield size={16} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center text-zinc-600 italic text-sm font-medium">
              No members found in the pulse records.
            </div>
          )}
        </div>
      </div>

      {/* Update Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl w-full max-w-md shadow-2xl"
          >
            <h2 className="text-xl font-bold mb-1">Manage Subscription</h2>
            <p className="text-sm text-zinc-500 mb-6 font-medium">Update account for {selectedUser?.name}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Select Plan</label>
                <select 
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600 appearance-none cursor-pointer"
                >
                  <option value="FREE">FREE PLAN</option>
                  <option value="PRO">PRO PLAN (+ $29/mo)</option>
                  <option value="ENTERPRISE">ENTERPRISE (+ $99/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Custom MRR ($)</label>
                <input 
                  type="number" 
                  value={newMrr}
                  onChange={(e) => setNewMrr(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 py-3 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-all text-zinc-400"
                >
                  Discard
                </button>
                <button 
                  onClick={handleUpdateSubmit}
                  disabled={isSaving}
                  className="flex-[2] bg-white text-black py-3 rounded-xl text-sm font-black hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
