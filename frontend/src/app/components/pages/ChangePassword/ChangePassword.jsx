import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { KeyRound, Lock, Check, X, ShieldCheck, LogOut, ArrowLeft } from "lucide-react";
import { api } from "../../../lib/api";
import { toast } from "sonner";

export function ChangePassword() {
  const navigate = useNavigate();
  const isTenant = localStorage.getItem("isTenantAuthenticated") === "true";
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("isTenantAuthenticated");
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("tenantId");
    localStorage.removeItem("tenantName");
    localStorage.removeItem("mustChangePassword");
    navigate(isTenant ? "/tenant/login" : "/login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");
    try {
      if (newPassword.length < 6) {
        toast.error("New password must be at least 6 characters long.");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match.");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
        return;
      }

      const payload = { current_password: currentPassword, new_password: newPassword };
      if (isTenant) {
        await api.tenantChangePassword(payload);
      } else {
        await api.staffChangePassword(payload);
      }

      localStorage.removeItem("mustChangePassword");
      setStatus("success");
      toast.success("Password updated successfully!");
      setTimeout(() => navigate(isTenant ? "/tenant" : "/"), 1500);
    } catch (err) {
      toast.error(err.message || "Failed to update password.");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black font-sans antialiased text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="relative group bg-white/[0.03] backdrop-blur-3xl border border-white/10 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-3xl shadow-xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          <div className="px-8 pt-10 pb-6 text-center">
            <div className="mx-auto w-16 h-16 relative flex items-center justify-center mb-5">
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Change Password</h1>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {isTenant ? "Resident Portal" : "Admin Portal"} &bull; Update your login password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-4">
            <div className="space-y-2">
              <div className="relative group/field">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                <input
                  name="currentPassword"
                  type="password"
                  placeholder="Current Password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative group/field">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                <input
                  name="newPassword"
                  type="password"
                  placeholder="New Password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative group/field">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white dark:focus:bg-white/[0.06] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all relative overflow-hidden group/btn ${
                status === "success"
                  ? "bg-emerald-500 text-white"
                  : status === "error"
                  ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  : "bg-indigo-600 text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-500"
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : status === "success" ? (
                <Check className="w-5 h-5" />
              ) : status === "error" ? (
                <X className="w-5 h-5" />
              ) : (
                <>
                  <span>Update Password</span>
                  <KeyRound className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:rotate-12 transition-all" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => navigate(isTenant ? "/tenant" : "/")}
                className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-white/40 hover:text-indigo-600 dark:hover:text-white/70 transition-colors font-bold uppercase tracking-widest"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-white/40 hover:text-red-600 dark:hover:text-red-400 transition-colors font-bold uppercase tracking-widest"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
