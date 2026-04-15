import { useEffect, useState } from "react";
import { 
  MessageSquareWarning, 
  Plus, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  Search,
  Filter,
  Send,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import { Badge } from "../../ui/badge";
import { cn } from "../../ui/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

const CATEGORIES = ["Maintenance", "Cleaning", "Electrical", "WiFi", "Food", "Other"];
const PRIORITIES = ["Low", "Medium", "High"];

export function TenantComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    category: "Maintenance",
    title: "",
    description: "",
    priority: "Medium"
  });

  const fetchComplaints = async () => {
    const tenantId = localStorage.getItem("tenantId");
    try {
      const resp = await fetch(`http://localhost:8000/tenant/dashboard/${tenantId}`);
      const data = await resp.json();
      setComplaints(data.complaints);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const tenantId = localStorage.getItem("tenantId");
    try {
      const response = await fetch("http://localhost:8000/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tenant_id: parseInt(tenantId),
          status: "open",
          priority: formData.priority.toLowerCase()
        })
      });
      if (response.ok) {
        setIsModalOpen(false);
        setFormData({ category: "Maintenance", title: "", description: "", priority: "Medium" });
        fetchComplaints();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-black tracking-tight mb-2">My Complaints</h1>
          <p className="text-muted-foreground font-medium">Track your service requests and report issues.</p>
        </motion.div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-6 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95">
              <Plus className="w-5 h-5 mr-2" />
              <span className="font-bold">Raise New Complaint</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Report an Issue</DialogTitle>
              <DialogDescription className="font-medium">Please provide details so we can resolve it quickly.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger className="py-6 rounded-xl bg-gray-50 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Priority</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                      <SelectTrigger className="py-6 rounded-xl bg-gray-50 border-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Short Title</Label>
                  <Input id="title" placeholder="e.g. WiFi not working" className="py-6 rounded-xl bg-gray-50 border-none" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Detailed Description</Label>
                  <Textarea id="desc" placeholder="Explain the issue in detail..." className="rounded-xl bg-gray-50 border-none min-h-[120px]" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full py-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                  <Send className="w-4 h-4 mr-2" /> Submit Complaint
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: "Open", count: complaints.filter(c => c.status === "open").length, color: "bg-blue-600" },
           { label: "In Progress", count: complaints.filter(c => c.status === "in-progress").length, color: "bg-amber-600" },
           { label: "Resolved", count: complaints.filter(c => c.status === "resolved").length, color: "bg-green-600" },
           { label: "Closed", count: complaints.filter(c => c.status === "closed").length, color: "bg-gray-600" },
         ].map((stat, i) => (
           <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
             <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{stat.label}</div>
             <div className="flex items-center justify-between">
                <div className="text-2xl font-black">{stat.count}</div>
                <div className={cn("w-2 h-2 rounded-full", stat.color)} />
             </div>
           </motion.div>
         ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-800/30 text-left text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                <th className="px-6 py-4">Complaint ID</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center font-bold animate-pulse">Loading complaints...</td></tr>
              ) : complaints.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-10 text-center font-bold text-muted-foreground">No complaints raised yet.</td></tr>
              ) : complaints.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="font-black text-xs text-indigo-600">#COMP-{c.id}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-sm">{c.title}</div>
                    <div className="text-[10px] text-muted-foreground font-medium truncate max-w-[200px]">{c.description}</div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 text-[10px] font-black">{c.category}</Badge>
                  </td>
                  <td className="px-6 py-5">
                     <div className={cn(
                       "flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider",
                       c.priority === "high" ? "text-red-500" : c.priority === "medium" ? "text-amber-500" : "text-blue-500"
                     )}>
                       <div className={cn("w-1.5 h-1.5 rounded-full", c.priority === "high" ? "bg-red-500" : c.priority === "medium" ? "bg-amber-500" : "bg-blue-500")} />
                       {c.priority}
                     </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider",
                      c.status === "open" ? "bg-blue-100 text-blue-700" :
                      c.status === "in-progress" ? "bg-amber-100 text-amber-700" :
                      c.status === "resolved" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                    )}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-bold text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
