import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router";
import { 
  Building2, 
  Bed, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  ArrowUpRight,
  Receipt,
  MapPin,
  Bell,
  MessageSquareWarning
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { cn } from "../../ui/utils";
import { useDataRefresh, notifyDataUpdated } from "../../../lib/dataEvents";
import { toast } from "sonner";
import { PayRentModal } from "../TenantRent/PayRentModal";

export function TenantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const navigate = useNavigate();
  const notifiedStatus = useRef(null);

  const fetchData = useCallback(async () => {
    const tenantId = localStorage.getItem("tenantId");
    if (!tenantId) {
      navigate("/tenant/login");
      return;
    }
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/tenant/dashboard/${tenantId}`);
      const result = await response.json();
      
      if (!response.ok) {
        if (response.status === 404) {
          // Session is invalid (e.g. database reset)
          localStorage.clear();
          navigate("/tenant/login");
        }
        throw new Error(result.detail || "Failed to load dashboard");
      }
      
      setData(result);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh when notices, complaints, or tenant data changes via WebSocket
  useDataRefresh(["notices", "complaints", "tenants", "rent"], fetchData);

  // Notify when rent is due or overdue
  useEffect(() => {
    if (!data?.tenant) return;
    const { rent_status, rent_amount, rent_due_date } = data.tenant;
    if (rent_status === 'due' && notifiedStatus.current !== 'due') {
      notifiedStatus.current = 'due';
      window.dispatchEvent(new CustomEvent("pg-notification", {
        detail: {
          category: "rent_due",
          title: "💸 Rent Payment Due",
          message: `Your rent of ₹${rent_amount} is due by ${rent_due_date}. Please pay on time to avoid late fees.`,
          tenant_id: parseInt(localStorage.getItem("tenantId"), 10),
        }
      }));
    } else if (rent_status === 'overdue' && notifiedStatus.current !== 'overdue') {
      notifiedStatus.current = 'overdue';
      window.dispatchEvent(new CustomEvent("pg-notification", {
        detail: {
          category: "rent_overdue",
          title: "🚨 Rent Payment Overdue",
          message: `Your rent of ₹${rent_amount} was due on ${rent_due_date}. Pay immediately to avoid penalties.`,
          tenant_id: parseInt(localStorage.getItem("tenantId"), 10),
        }
      }));
    }
  }, [data]);

  const handleCloseTicket = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/complaints/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" })
      });
      if (response.ok) {
        fetchData();
        notifyDataUpdated("complaints");
        toast.success("Ticket closed successfully! Thank you for your feedback.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to close ticket");
    }
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-muted-foreground animate-pulse">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error || !data || !data.tenant) return (
    <div className="p-8 text-center flex flex-col items-center gap-4">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Session Error</h2>
        <p className="text-muted-foreground">{error || "Your session is invalid or has expired."}</p>
      </div>
      <Button onClick={() => { localStorage.clear(); navigate("/tenant/login"); }} className="bg-indigo-600">
        Return to Login
      </Button>
    </div>
  );

  const { tenant, property, room, transactions } = data;

  return (
    <div className="pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Room Info Card */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2"
        >
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border-l-[6px] border-indigo-600 h-full">
            <CardContent className="p-8">
               <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-6 flex-1">
                    <div>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Current Residence</h2>
                        <div className="flex items-center gap-3">
                            <h3 className="text-3xl font-black tracking-tight">{property?.name || "Premium PG"}</h3>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 uppercase text-[10px] font-black">Resident</Badge>
                        </div>
                        <p className="text-muted-foreground font-medium flex items-center gap-1.5 mt-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {property?.address}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Building2 className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Room Number</span>
                            </div>
                            <div className="text-2xl font-black">{tenant.room_number}</div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <Bed className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Bed ID</span>
                            </div>
                            <div className="text-2xl font-black">{tenant.bed_number}</div>
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-col bg-gray-50 dark:bg-gray-800/50 p-6 rounded-3xl min-w-[200px]">
                     <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Management Contact</div>
                     {property?.manager ? (
                       <>
                         <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <span className="text-xs font-black text-indigo-600">{property.manager.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="font-bold text-sm">{property.manager}</div>
                         </div>
                         <div className="text-xs font-bold text-muted-foreground">{property?.phone || "Phone not set"}</div>
                         <Button variant="link" className="px-0 h-auto justify-start text-indigo-600 text-xs font-black mt-4">
                            Contact via WhatsApp <ArrowUpRight className="ml-1 w-3 h-3" />
                         </Button>
                       </>
                     ) : (
                       <div className="flex flex-col items-center justify-center flex-1 text-center gap-2 py-2">
                         <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                           <Building2 className="w-4 h-4 text-gray-400" />
                         </div>
                         <p className="text-xs font-bold text-muted-foreground">No manager assigned yet</p>
                         <p className="text-[10px] text-muted-foreground opacity-70">Contact your property owner directly</p>
                       </div>
                     )}
                  </div>
               </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Rent Status Card */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:row-span-2"
        >
          <Card className={cn(
            "border-none shadow-xl rounded-3xl h-full flex flex-col justify-center bg-white dark:bg-gray-900",
            tenant.rent_status === 'overdue' ? 'border-t-[6px] border-red-500' : 'border-t-[6px] border-green-500'
          )}>
            <CardContent className="p-8 text-center space-y-6">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-4">Payment Status</h3>
                    <div className={cn(
                        "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 shadow-lg",
                        tenant.rent_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    )}>
                        {tenant.rent_status === 'paid' ? <CheckCircle2 className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                    </div>
                    <div className="text-3xl font-black mb-1">₹{tenant.rent_amount}</div>
                    <div className="text-sm font-bold uppercase tracking-widest opacity-60">Monthly Rent</div>
                </div>

                <div className="pt-2">
                    <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Rent Status</div>
                    <Badge variant="outline" className={cn(
                        "rounded-full px-4 py-1.5 font-black uppercase text-[10px] tracking-widest",
                        tenant.rent_status === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'
                    )}>
                        {tenant.rent_status}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-6 mt-2">
                    <div className="text-left">
                        <div className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Due Date</div>
                        <div className="text-sm font-black">{tenant.rent_due_date}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[8px] font-black text-muted-foreground uppercase opacity-70">Advance</div>
                        <div className="text-sm font-black">₹{tenant.advance}</div>
                    </div>
                </div>

                 <Button 
                    onClick={() => setIsPayModalOpen(true)}
                    disabled={tenant.rent_status === 'paid'}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-indigo-300 disabled:text-white/80 font-bold rounded-2xl py-6 shadow-xl shadow-indigo-100 dark:shadow-none"
                 >
                    {tenant.rent_status === 'paid' ? 'Rent Paid' : 'Make Quick Payment'}
                 </Button>
            </CardContent>
          </Card>
        </motion.div>

         {/* Recent Notices */}
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-800"
         >
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                     <Bell className="w-4 h-4 text-indigo-600" />
                  </div>
                  Recent Notices
               </h3>
               <Link to="/tenant/notices" className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] hover:underline">View All</Link>
            </div>
            
            <div className="space-y-4">
               {data.notices?.slice(0, 3).map((notice, i) => (
                  <div key={i} className={cn(
                    "p-4 rounded-2xl border transition-all",
                    notice.urgent ? "bg-red-50/50 border-red-100" : "bg-gray-50/50 border-gray-100 dark:border-gray-800"
                  )}>
                     <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-sm truncate">{notice.title}</div>
                        {notice.urgent && <Badge className="bg-red-500 text-[8px] font-black uppercase">Urgent</Badge>}
                     </div>
                     <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{notice.content}</p>
                     <div className="text-[10px] font-black text-muted-foreground uppercase">{new Date(notice.created_at).toLocaleDateString()}</div>
                  </div>
               ))}
               {data.notices?.length === 0 && <p className="text-center py-10 italic text-muted-foreground font-bold">No announcements yet.</p>}
               {data.notices?.length > 3 && (
                  <Link to="/tenant/notices" className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors group">
                     <Bell className="w-3.5 h-3.5 text-indigo-600" />
                     <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">+{data.notices.length - 3} more notice{data.notices.length - 3 > 1 ? 's' : ''}</span>
                     <ArrowUpRight className="w-3.5 h-3.5 text-indigo-600 transition-opacity" />
                  </Link>
               )}
            </div>
         </motion.div>

         {/* My Complaints Status */}
         <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-indigo-950 rounded-3xl p-8 shadow-2xl overflow-hidden relative"
         >
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
               <h3 className="text-xl font-black tracking-tight text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                     <MessageSquareWarning className="w-4 h-4 text-white" />
                  </div>
                  My Complaints
               </h3>
               <Link to="/tenant/complaints" className="text-[10px] font-black uppercase text-white/60 tracking-[0.2em] hover:text-white">Track All</Link>
            </div>

            <div className="space-y-4 relative z-10">
               {data.complaints?.slice(0, 3).map((c, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between p-4 rounded-2xl hover:bg-white/10 transition-colors animate-fade-in">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                           "w-2 h-2 rounded-full",
                           c.status === 'open' ? 'bg-blue-400' :
                           c.status === 'in-progress' ? 'bg-amber-400' : 'bg-green-400'
                        )} />
                        <div>
                           <div className="text-white font-bold text-sm">{c.title}</div>
                           <div className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                              {c.status === 'resolved' ? 'Finished' : c.status}
                           </div>
                        </div>
                     </div>
                     {(c.status === 'open' || c.status === 'in-progress') && (
                        <Button
                           size="sm"
                           variant="ghost"
                           className="text-white hover:text-indigo-950 hover:bg-white rounded-xl px-3 py-1 text-xs font-bold transition-all h-8 flex items-center gap-1"
                           onClick={(e) => {
                              e.preventDefault();
                              handleCloseTicket(c.id);
                           }}
                        >
                           <CheckCircle2 className="w-3.5 h-3.5" /> Close
                        </Button>
                     )}
                  </div>
               ))}
               {data.complaints?.length === 0 && <div className="text-white/40 text-sm italic py-10 text-center font-bold">No active complaints.</div>}
               {data.complaints?.length > 3 && (
                  <Link to="/tenant/complaints" className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group">
                     <MessageSquareWarning className="w-3.5 h-3.5 text-white/70" />
                     <span className="text-xs font-black text-white/70 uppercase tracking-widest">+{data.complaints.length - 3} more complaint{data.complaints.length - 3 > 1 ? 's' : ''}</span>
                     <ArrowUpRight className="w-3.5 h-3.5 text-white/70 transition-opacity" />
                  </Link>
               )}
               
               <Button asChild className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-black mt-4">
                  <Link to="/tenant/complaints">Raise New Ticket</Link>
               </Button>
            </div>
         </motion.div>
      </div>
      {data?.tenant && (
        <PayRentModal
          isOpen={isPayModalOpen}
          onClose={() => setIsPayModalOpen(false)}
          tenant={data.tenant}
          property={data.property}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}
    </div>
  );
}
