"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/context/Auth_Context";
import { motion } from "framer-motion";
import {
  Save,
  User,
  Camera,
  Loader2,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import api from "@/lib/api";

export default function SettingsPage() {
  const { user, checkAuth } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { logout: authLogout } = useAuth();

  // Derive initial image avatar
  // For the sake of the demo, if image is an absolute URL (like an external avatar), use it directly.
  // If it's a relative path from our backend, prefix it with the API URL.
  const getAvatarUrl = (path: string | undefined | null) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") ||
      "http://localhost:8000";
    return `${baseUrl}${path}`;
  };

  const currentAvatar = preview || getAvatarUrl(user?.image);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
      setSuccess(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const formData = new FormData();
      if (name !== user?.name) {
        formData.append("name", name);
      }
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (!formData.has("name") && !formData.has("image")) {
        setLoading(false);
        return; // Nothing to update
      }

      const response = await api.put("/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        setSuccess(true);
        // Refresh global user context to update header avatars
        await checkAuth();
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword === currentPassword) {
      setPasswordError("New password cannot be the same as current password.");
      setPasswordLoading(false);
      return;
    }

    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setPasswordError(
        axiosErr.response?.data?.message || "Failed to change password.",
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await api.delete("/auth/delete-account");
      authLogout(); // Redirect to home/login
    } catch (err) {
      console.error("Failed to delete account", err);
      alert("Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 p-8 pt-24 font-sans selection:bg-emerald-500/30">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-end border-b border-zinc-800 pb-6"
        >
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Account Settings
            </h1>
            <p className="text-zinc-500 mt-2">
              Manage your public profile and preferences.
            </p>
          </div>
        </motion.div>

        {/* Billing Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/20 transition-all"
        >
          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white leading-none">
                  Billing & Subscription
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs text-zinc-500">Current Plan:</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {user?.subscription?.plan || "FREE"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  const res = await api.post("/subscriptions/portal");
                  if (res.data.url) {
                    window.location.href = res.data.url;
                  }
                } catch (err) {
                  console.error("Failed to open billing portal", err);
                  alert(
                    "Billing portal is only available for paid subscribers or accounts with a Stripe ID.",
                  );
                }
              }}
              className="bg-zinc-800 hover:bg-white hover:text-black text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2"
            >
              Manage Billing
              <ArrowLeft className="rotate-180" size={16} />
            </button>
          </div>
        </motion.div>

        {/* Content Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl"
        >
          {/* Decorative glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-12 relative z-10">
            {/* Left: Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div
                onClick={handleImageClick}
                className="relative w-32 h-32 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center overflow-hidden cursor-pointer group transition-all hover:border-emerald-500/50"
              >
                {currentAvatar ? (
                  <Image
                    src={currentAvatar}
                    alt="Avatar"
                    width={128}
                    height={128}
                    unoptimized={
                      currentAvatar.startsWith("http://localhost") ||
                      currentAvatar.startsWith("blob:")
                    }
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User
                    size={40}
                    className="text-zinc-500 group-hover:text-zinc-400 transition-colors"
                  />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-sm">
                  <Camera size={24} className="text-white mb-1" />
                  <span className="text-[10px] font-medium text-white uppercase tracking-wider">
                    Change
                  </span>
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <p className="text-xs text-zinc-500 text-center uppercase tracking-widest">
                Profile Photo
              </p>
            </div>

            {/* Right: Form Info */}
            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSuccess(false);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white placeholder-zinc-700 outline-none transition-all shadow-inner"
                    placeholder="E.g. Elon Musk"
                  />
                </div>

                <div className="space-y-1.5 opacity-60 cursor-not-allowed">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 normal-case tracking-normal">
                      Immutable
                    </span>
                  </label>
                  <input
                    type="text"
                    value={user?.email || ""}
                    disabled
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 outline-none shadow-inner"
                  />
                </div>

                <div className="space-y-1.5 opacity-60 cursor-not-allowed">
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Account Role
                  </label>
                  <input
                    type="text"
                    value={user?.Role || "USER"}
                    disabled
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-500 outline-none uppercase tracking-widest text-sm shadow-inner"
                  />
                </div>
              </div>

              {/* Status Messages */}
              {error && (
                <p className="text-sm border border-rose-500/20 bg-rose-500/10 text-rose-400 p-3 rounded-lg flex items-center">
                  ⚠️ {error}
                </p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 p-3 rounded-lg flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Profile updated successfully!
                </motion.p>
              )}

              {/* Action */}
              <div className="pt-4 border-t border-zinc-800/50 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={loading || (name === user?.name && !imageFile)}
                  className="bg-white text-black font-semibold py-2.5 px-6 rounded-xl shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 transition-all outline-none focus:ring-2 focus:ring-white/50 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none">
                Security
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Update your password to keep your account safe.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all shadow-inner"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white outline-none transition-all shadow-inner"
              />
            </div>

            {passwordError && (
              <p className="text-xs text-rose-400">⚠️ {passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-xs text-emerald-400">
                ✅ Password changed successfully!
              </p>
            )}

            <button
              type="submit"
              disabled={passwordLoading || !currentPassword || !newPassword}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-2 px-6 rounded-xl transition-all disabled:opacity-50 text-sm"
            >
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-none">
                Danger Zone
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Irreversible actions for your account.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <h4 className="font-bold text-white">Delete Account</h4>
              <p className="text-xs text-zinc-500">
                This will permanently delete your profile, integration keys, and
                pulse history.
              </p>
            </div>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 px-6 py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Delete Account
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-sm font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Confirm Delete
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
