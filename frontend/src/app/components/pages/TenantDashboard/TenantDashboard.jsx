import { useEffect, useState } from "react";
import { Link } from "react-router";
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

export function TenantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const tenantId = localStorage.getItem("tenantId");
      if (!tenantId) return;
      
      try {
        const response = await fetch(`http://localhost:8000/tenant/dashboard/${tenantId}`);
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-muted-foreground animate-pulse">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (!data) return <div className="p-8 text-center font-bold">Failed to load dashboard data.</div>;

  const { tenant, property, room, transactions } = data;

  return (
    <div className="space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Room Info Card */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
        >
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border-l-[6px] border-indigo-600">
            <CardContent className="p-8">
               <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-6">
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
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                            <span className="text-xs font-black text-indigo-600">{property?.manager?.[0]}</span>
                        </div>
                        <div className="font-bold text-sm">{property?.manager}</div>
                     </div>
                     <div className="text-xs font-bold text-muted-foreground">{property?.phone}</div>
                     <Button variant="link" className="px-0 h-auto justify-start text-indigo-600 text-xs font-black mt-4">
                        Contact via WhatsApp <ArrowUpRight className="ml-1 w-3 h-3" />
                     </Button>
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

                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl py-6 shadow-xl shadow-indigo-100 dark:shadow-none">
                   Make Quick Payment
                </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div key={i} className="bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between p-4 rounded-2xl hover:bg-white/10 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          c.status === 'open' ? 'bg-blue-400' : 'bg-green-400'
                        )} />
                        <div>
                           <div className="text-white font-bold text-sm">{c.title}</div>
                           <div className="text-[10px] text-white/50 font-black uppercase tracking-widest">{c.status}</div>
                        </div>
                     </div>
                  </div>
               ))}
               {data.complaints?.length === 0 && <div className="text-white/40 text-sm italic py-10 text-center font-bold">No active complaints.</div>}
               
               <Button asChild className="w-full bg-white text-indigo-600 hover:bg-white/90 rounded-xl font-black mt-4">
                  <Link to="/tenant/complaints">Raise New Ticket</Link>
               </Button>
            </div>
         </motion.div>
      </div>
    </div>
  );
}
