import { useEffect, useState } from "react";
import { 
  Bell, 
  Calendar, 
  User, 
  AlertTriangle,
  Info,
  ChevronRight
} from "lucide-react";
import { motion } from "motion/react";
import { Card, CardContent } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { cn } from "../../ui/utils";

export function TenantNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      const tenantId = localStorage.getItem("tenantId");
      try {
        const resp = await fetch(`http://localhost:8000/tenant/dashboard/${tenantId}`);
        const data = await resp.json();
        setNotices(data.notices);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotices();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-3xl font-black tracking-tight mb-2">Community Notices</h1>
        <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500 animate-pulse" />
            Stay updated with the latest updates from your PG management.
        </p>
      </motion.div>

      <div className="max-w-4xl space-y-4">
        {loading ? (
          <div className="p-20 text-center font-bold animate-pulse">Checking for bulletins...</div>
        ) : notices.length === 0 ? (
          <div className="p-20 text-center bg-white dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-gray-800">
             <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
             <p className="font-bold text-muted-foreground italic">No active notices for your property.</p>
          </div>
        ) : notices.map((notice, i) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className={cn(
              "border-none shadow-sm rounded-3xl overflow-hidden group hover:shadow-xl transition-all duration-300",
              notice.urgent ? "bg-red-50 dark:bg-red-900/10 border-l-[6px] border-red-500" : "bg-white dark:bg-gray-900 border-l-[6px] border-indigo-600"
            )}>
              <CardContent className="p-6 md:p-8">
                 <div className="flex flex-col md:flex-row gap-6">
                    <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg",
                        notice.urgent ? "bg-red-500 text-white" : "bg-indigo-600 text-white"
                    )}>
                        {notice.urgent ? <AlertTriangle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black tracking-tight leading-tight">{notice.title}</h3>
                                    {notice.urgent && <Badge className="bg-red-100 text-red-600 hover:bg-red-100 font-black text-[10px] uppercase">Urgent Announcement</Badge>}
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(notice.created_at).toLocaleDateString()}</span>
                                    <span className="flex items-center gap-1.5"><User className="w-3 h-3" /> {notice.created_by}</span>
                                </div>
                            </div>
                        </div>

                        <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                            {notice.content}
                        </p>

                        <div className="flex items-center gap-4 pt-2">
                             <div className="px-4 py-2 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                Broadcast: {notice.property_name}
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center">
                        <ChevronRight className="w-6 h-6 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                 </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
