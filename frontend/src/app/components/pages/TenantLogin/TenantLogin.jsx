import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Home, Phone, Mail, ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function TenantLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("http://localhost:8000/tenant/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem("isTenantAuthenticated", "true");
        localStorage.setItem("tenantId", data.id);
        localStorage.setItem("tenantName", data.name);
        navigate("/tenant");
      } else {
        setError(data.detail || "Invalid login credentials");
      }
    } catch (err) {
      setError("Server connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-gray-900">
          <div className="h-2 bg-indigo-600 w-full" />
          <CardHeader className="space-y-4 text-center pt-10 pb-6">
            <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center shadow-inner">
              <Home className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight">Tenant <span className="text-indigo-600">Portal</span></CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                Welcome back to your PG home
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2"
                >
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                  {error}
                </motion.div>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className="pl-11 py-6 bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl focus-visible:ring-2 ring-indigo-500/20"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Phone Number (as Password)</Label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      id="phone"
                      type="text"
                      placeholder="+91 XXXXX XXXXX"
                      className="pl-11 py-6 bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl focus-visible:ring-2 ring-indigo-500/20"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-xl shadow-indigo-100 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Verifying..." : "Access My Portal"}
                {!loading && <ArrowRight className="ml-2 w-5 h-5" />}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground font-medium pt-2">
                Forgotten your details? Contact your PG manager for assistance.
              </p>
            </form>
          </CardContent>
        </Card>
        
        <p className="mt-8 text-center text-sm text-muted-foreground font-bold uppercase tracking-tighter">
          Powered by <span className="text-indigo-600">PG Manager Pro</span>
        </p>
      </motion.div>
    </div>
  );
}
