import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Building2, Smartphone, Mail, Lock, Check, X, ShieldCheck, Sparkles, User, KeyRound, Hash, Phone } from "lucide-react";
import { api, setToken } from "../../../lib/api";
import { Label } from "../../ui/label";
import { LoginBackground } from "./LoginBackground";
import { toast } from "sonner";

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState(location.pathname.includes("tenant") ? "tenant" : "owner"); 
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [isSignup, setIsSignup] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    phone: "",
    name: "",
    tenantId: ""
  });
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  // Check for existing session
  useEffect(() => {
    const isOwnerAuthed = localStorage.getItem("isAuthenticated") === "true";
    const isTenantAuthed = localStorage.getItem("isTenantAuthenticated") === "true";

    if (isOwnerAuthed) {
      navigate("/");
    } else if (isTenantAuthed) {
      navigate("/tenant");
    }
  }, [navigate]);

  // 3D Tilt Effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleChange = (e) => {
    setCredentials(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (status === "error") setStatus("idle");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (showOtp) {
      await handleOtpSubmit(e);
    } else {
      await handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      if (role === "owner") {
        if (isSignup) {
          const response = await api.ownerSignup({
            email: credentials.email,
            password: credentials.password,
            name: credentials.name
          });
          
          if (response.status === "otp_pending") {
            setShowOtp(true);
            toast.info("Verification code sent to your email!");
            setStatus("idle");
          } else {
            toast.success("Account created! Please login.");
            setIsSignup(false);
            setStatus("success");
          }
        } else {
          const response = await api.ownerLogin({
            email: credentials.email,
            password: credentials.password
          });
          
          // No OTP for login as per user request
          handleLoginSuccess(response);
        }
      } else {
        const response = await api.tenantLogin({ 
          tenant_id: parseInt(credentials.tenantId, 10), 
          phone: credentials.phone.trim() 
        });
        const data = response.user;
        setToken(response.access_token);
        localStorage.setItem("jwtToken", response.access_token); // Backup for refresh
        localStorage.setItem("isTenantAuthenticated", "true");
        localStorage.setItem("tenantId", data.id);
        localStorage.setItem("tenantName", data.name);
        setStatus("success");
        toast.success(`Welcome to the Tenant Portal, ${data.name}!`);
        setTimeout(() => navigate("/tenant"), 1200);
      }
    } catch (err) {
      console.error("Auth Error:", err);
      let errorMsg = err.message || "Authentication failed";
      
      if (err.message.includes("Failed to fetch")) {
        errorMsg = "Backend server is offline. Please start the server.";
      }
      
      toast.error(errorMsg);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const data = await api.verifyOtp({
        email: credentials.email,
        otp: otp
      });
      handleLoginSuccess(data);
    } catch (err) {
      toast.error(err.message || "Invalid OTP");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (response) => {
    const data = response.user;
    setToken(response.access_token);
    localStorage.setItem("jwtToken", response.access_token); // Backup for refresh
    localStorage.setItem("ownerId", data.owner_id || data.id);
    localStorage.setItem("ownerName", data.name);
    localStorage.setItem("userRole", data.role || "Owner");
    localStorage.setItem("propertyId", data.property_id || "");
    localStorage.setItem("propertyIds", data.property_ids ? data.property_ids.join(",") : (data.property_id || ""));
    localStorage.setItem("propertyNames", data.property_names ? data.property_names.join(", ") : (data.property_name || ""));
    localStorage.setItem("isAuthenticated", "true");
    setStatus("success");
    toast.success(`Welcome back, ${data.name}!`);
    setTimeout(() => navigate("/"), 1200);
  };

  return (
    <LoginBackground isOpen={status === "success"} isError={status === "error"}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative group"
      >
        {/* Abstract Glow Behind Card */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div 
          style={{ transform: "translateZ(50px)" }}
          className="relative bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden w-full max-w-md"
        >
          {/* Top Decorative bar */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

          {/* Header Area */}
          <div className="px-8 pt-10 pb-6 text-center">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mx-auto w-16 h-16 relative flex items-center justify-center mb-6"
            >
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
              <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center shadow-2xl">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-widest uppercase">
              {isSignup ? "Create Account" : "Portal Login"}
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">AI-Powered PG System</p>
            </div>
          </div>

          {/* Role Selector */}
          {!showOtp && (
            <div className="px-8 pb-4">
              <div className="p-1 bg-white/[0.03] rounded-2xl flex gap-1 border border-white/5">
                <button
                  onClick={() => setRole("owner")}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${
                    role === "owner" ? "bg-white/10 text-white border border-white/10 shadow-xl" : "text-white/30 hover:text-white/50"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  ADMIN
                </button>
                <button
                  onClick={() => setRole("tenant")}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black tracking-widest transition-all flex items-center justify-center gap-2 ${
                    role === "tenant" ? "bg-white/10 text-white border border-white/10 shadow-xl" : "text-white/30 hover:text-white/50"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  TENANT
                </button>
              </div>
            </div>
          )}

          {/* Form Area */}
          <div className="p-8 space-y-6">
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div className="space-y-5">
                {role === "tenant" ? (
                  <>
                    <div className="space-y-2">
                      <div className="relative group/field">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                        <input
                          name="tenantId"
                          type="text"
                          inputMode="numeric"
                          pattern="\d*"
                          placeholder="Tenant ID (e.g. 1, 2, 3)"
                          required
                          value={credentials.tenantId}
                          onChange={handleChange}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.06] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative group/field">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                        <input
                          name="phone"
                          type="tel"
                          placeholder="Phone Number"
                          required
                          value={credentials.phone}
                          onChange={handleChange}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.06] transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {isSignup && role === "owner" && (
                      <div className="space-y-2">
                        <div className="relative group/field">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                          <input
                            name="name"
                            type="text"
                            placeholder="Full Name"
                            required
                            value={credentials.name}
                            onChange={handleChange}
                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.06] transition-all"
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <div className="relative group/field">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                        <input
                          name="email"
                          type="email"
                          placeholder="Email Address"
                          required
                          value={credentials.email}
                          onChange={handleChange}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.06] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="relative group/field">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                        <input
                          name="password"
                          type="password"
                          placeholder="Password"
                          required
                          value={credentials.password}
                          onChange={handleChange}
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white/[0.06] transition-all"
                        />
                      </div>
                    </div>
                  </>
                )}

                {showOtp && role === "owner" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="space-y-2"
                  >
                    <div className="relative group/field">
                      <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within/field:text-indigo-400 transition-colors" />
                      <input
                        name="otp"
                        type="text"
                        placeholder="6-Digit OTP"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full bg-indigo-500/10 border border-indigo-500/30 rounded-2xl pl-11 pr-4 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-indigo-500/20 transition-all font-mono tracking-[0.5em]"
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, translateY: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className={`w-full py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all relative overflow-hidden group/btn ${
                  status === "success" 
                    ? "bg-emerald-500 text-white" 
                    : status === "error" 
                    ? "bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]" 
                    : "bg-indigo-600 text-white shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)] hover:bg-indigo-500"
                }`}
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:animate-[shine_1.5s_ease-in-out_infinite]" />
                
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : status === "success" ? (
                  <Check className="w-5 h-5" />
                ) : status === "error" ? (
                  <X className="w-5 h-5" />
                ) : (
                  <>
                    <span>{showOtp ? "Verify OTP" : (isSignup ? "Create Account" : "Enter Portal")}</span>
                    <Sparkles className="w-3.5 h-3.5 opacity-50 group-hover/btn:opacity-100 group-hover/btn:rotate-12 transition-all" />
                  </>
                )}
              </motion.button>

              {role === "owner" && !showOtp && (
                <button
                  type="button"
                  onClick={() => setIsSignup(!isSignup)}
                  className="w-full text-center text-[10px] text-white/30 hover:text-white/60 transition-colors font-bold uppercase tracking-widest"
                >
                  {isSignup ? "Already have an account? Login" : "New here? Create an account"}
                </button>
              )}
            </form>
            
            <div className="flex flex-col items-center gap-4 pt-2">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em]">
                Secure Cloud Access &bull; v2.0.4
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes shine {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </LoginBackground>
  );
}
